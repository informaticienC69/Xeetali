"""Tests du domaine Administration (dashboard, CRUD role-gated)."""
from __future__ import annotations
import pytest

from collections.abc import Callable
from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.schemas.enums import BloodGroup, PouchStatus


@pytest.mark.asyncio
async def test_dashboard_aggregates(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    resp = await client.get("/api/admin/dashboard", headers=await auth("admin@cnts.sn"))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_poches_disponibles"] == 8  # 5 O+ + 3 A+
    assert body["nb_hopitaux"] == 2
    assert body["nb_donneurs"] == 1


@pytest.mark.asyncio
async def test_dashboard_forbidden_for_non_admin(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    assert await client.get("/api/admin/dashboard", headers=await auth("medic@cnts.sn")).status_code == 403
    assert await client.get("/api/admin/dashboard", headers=await auth("donor@cnts.sn")).status_code == 403


@pytest.mark.asyncio
async def test_admin_user_crud(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    h = await auth("admin@cnts.sn")
    created = await client.post(
        "/api/admin/users",
        json={"nom": "Nouveau", "email": "new@cnts.sn", "password": "Password123!", "role": "PERSONNEL_MEDICAL"},
        headers=h,
    )
    assert created.status_code == 201
    uid = created.json()["id"]

    updated = await client.patch(f"/api/admin/users/{uid}", json={"nom": "Renommé"}, headers=h)
    assert updated.status_code == 200 and updated.json()["nom"] == "Renommé"

    assert await client.delete(f"/api/admin/users/{uid}", headers=h).status_code == 204


@pytest.mark.asyncio
async def test_admin_hospital_crud_and_role_gate(
    client: AsyncClient, seeded: dict, auth: Callable[[str], dict[str, str]]
) -> None:
    region_ids = seeded["region_ids"]

    # CRUD interdit au personnel médical.
    forbidden = await client.post(
        "/api/admin/hospitals",
        json={"nom": "X", "region_id": region_ids["Kaolack"], "type": "CHR"},
        headers=await auth("medic@cnts.sn"),
    )
    assert forbidden.status_code == 403

    h = await auth("admin@cnts.sn")
    created = await client.post(
        "/api/admin/hospitals",
        json={"nom": "CHR Kaolack", "region_id": region_ids["Kaolack"], "type": "CHR"},
        headers=h,
    )
    assert created.status_code == 201
    assert created.json()["region"]["nom"] == "Kaolack"
    hid = created.json()["id"]
    retyped = await client.patch(f"/api/admin/hospitals/{hid}", json={"type": "Hôpital"}, headers=h)
    assert retyped.json()["type"] == "Hôpital"
    moved = await client.patch(f"/api/admin/hospitals/{hid}", json={"region_id": region_ids["Louga"]}, headers=h)
    assert moved.json()["region"]["nom"] == "Louga"
    deleted = await client.delete(f"/api/admin/hospitals/{hid}", headers=h)
    assert deleted.status_code == 204

    # Région inexistante → 404, pas de création fantôme.
    bad_region = await client.post(
        "/api/admin/hospitals", json={"nom": "Y", "region_id": 999999, "type": "CHR"}, headers=h,
    )
    assert bad_region.status_code == 404


@pytest.mark.asyncio
async def test_analytics_shapes_and_db_derived(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    resp = await client.get("/api/admin/analytics", headers=await auth("admin@cnts.sn"))
    assert resp.status_code == 200
    body = resp.json()
    # Stock dérivé des poches : 5 O+ + 3 A+ = 8 disponibles.
    assert body["total_poches_disponibles"] == 8
    op = next(x for x in body["stock_par_groupe"] if x["label"] == "O+")
    assert op["value"] == 5
    # Séries temporelles de longueur fixe (30 jours, 6 mois).
    assert len(body["transferts_par_jour"]) == 30
    assert len(body["dons_par_mois"]) == 6
    # Les 4 statuts de poche sont présents.
    assert {x["label"] for x in body["poches_par_statut"]} == {
        "DISPONIBLE", "RESERVEE", "UTILISEE", "PERIMEE"
    }


@pytest.mark.asyncio
async def test_analytics_stock_par_hopital_limited_to_top_8(
    client: AsyncClient, db_session: AsyncSession, seeded: dict, auth: Callable[[str], dict[str, str]]
) -> None:
    """« Top établissements » est un classement des meneurs, pas un inventaire
    complet — au-delà de 8 hôpitaux avec du stock, la liste doit rester à 8,
    et ce sont bien les 8 mieux fournis (pas les 8 premiers créés)."""
    region_id = seeded["region_ids"]["Dakar"]
    today = date.today()
    # 10 hôpitaux supplémentaires, stock décroissant (10, 9, ..., 1) — le plus
    # petit stock (celui créé en dernier) doit être exclu du top 8.
    for i in range(10):
        h = Hospital(nom=f"Hôpital Extra {i}", region_id=region_id, type="Hôpital")
        db_session.add(h)
        await db_session.flush()
        for j in range(10 - i):
            db_session.add(BloodPouch(
                uid=f"EXTRA-{i}-{j}", groupe_sanguin=BloodGroup.O_POS.value, hospital_id=h.id,
                statut=PouchStatus.DISPONIBLE.value, date_prelevement=today,
                date_peremption=today + timedelta(days=30), qr_code_b64="data:image/png;base64,TEST",
            ))
    await db_session.commit()

    resp = await client.get("/api/admin/analytics", headers=await auth("admin@cnts.sn"))
    assert resp.status_code == 200
    body = resp.json()["stock_par_hopital"]

    assert len(body) == 8
    values = [row["value"] for row in body]
    assert values == sorted(values, reverse=True)
    # Le moins fourni des 10 extra (1 poche) ne doit pas apparaître dans le top 8.
    assert "Hôpital Extra 9" not in [row["label"] for row in body]


@pytest.mark.asyncio
async def test_analytics_forbidden_for_non_admin(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    assert await client.get("/api/admin/analytics", headers=await auth("donor@cnts.sn")).status_code == 403


@pytest.mark.asyncio
async def test_stock_by_region_derived_from_hospitals(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    resp = await client.get("/api/admin/stock-by-region", headers=await auth("admin@cnts.sn"))
    assert resp.status_code == 200
    body = resp.json()
    # Les 14 régions officielles sont toujours renvoyées, même sans hôpital.
    assert len(body) == 14
    by_name = {r["nom"]: r for r in body}

    dakar = by_name["Dakar"]
    assert dakar["nb_hopitaux"] == 1
    assert dakar["total_poches"] == 8  # 5 O+ + 3 A+ (fixture "seeded")
    op = next(g for g in dakar["groupes"] if g["groupe_sanguin"] == "O+")
    assert op["quantite"] == 5

    thies = by_name["Thiès"]
    assert thies["nb_hopitaux"] == 1
    assert thies["total_poches"] == 0
    assert thies["statut"] == "critique"

    # Région sans aucun hôpital rattaché : à 0, pas de division par zéro, et
    # surtout pas affichée comme « critique » (il n'y a rien à approvisionner).
    ziguinchor = by_name["Ziguinchor"]
    assert ziguinchor["nb_hopitaux"] == 0
    assert ziguinchor["total_poches"] == 0
    assert ziguinchor["stock_pct"] == 0.0
    assert ziguinchor["statut"] == "hors_reseau"


@pytest.mark.asyncio
async def test_stock_by_region_forbidden_for_non_admin(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    resp = await client.get("/api/admin/stock-by-region", headers=await auth("medic@cnts.sn"))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_regions_returns_the_14_regions(
    client: AsyncClient, seeded: dict, auth: Callable[[str], dict[str, str]]
) -> None:
    resp = await client.get("/api/admin/regions", headers=await auth("admin@cnts.sn"))
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 14
    dakar = next(r for r in body if r["nom"] == "Dakar")
    assert dakar["capitale"] == "Dakar"
    assert dakar["population"] > 0


@pytest.mark.asyncio
async def test_national_campaign(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    resp = await client.post(
        "/api/admin/campaigns", json={"groupe_sanguin": "O-", "localisation": "Dakar"},
        headers=await auth("admin@cnts.sn"),
    )
    assert resp.status_code == 201
    # La campagne force la portée nationale (localisation ignorée).
    assert resp.json()["portee"] == "NATIONALE"
