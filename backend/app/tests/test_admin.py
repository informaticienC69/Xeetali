"""Tests du domaine Administration (dashboard, CRUD role-gated)."""
from __future__ import annotations
import pytest

from collections.abc import Callable

from fastapi.testclient import TestClient


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
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    # CRUD interdit au personnel médical.
    forbidden = await client.post(
        "/api/admin/hospitals",
        json={"nom": "X", "localisation": "Y", "type": "CHR"},
        headers=await auth("medic@cnts.sn"),
    )
    assert forbidden.status_code == 403

    h = await auth("admin@cnts.sn")
    created = await client.post(
        "/api/admin/hospitals",
        json={"nom": "CHR Kaolack", "localisation": "Kaolack", "type": "CHR"},
        headers=h,
    )
    assert created.status_code == 201
    hid = created.json()["id"]
    assert await client.patch(f"/api/admin/hospitals/{hid}", json={"type": "Hôpital"}, headers=h).json()["type"] == "Hôpital"
    assert await client.delete(f"/api/admin/hospitals/{hid}", headers=h).status_code == 204


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
async def test_analytics_forbidden_for_non_admin(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    assert await client.get("/api/admin/analytics", headers=await auth("donor@cnts.sn")).status_code == 403


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
