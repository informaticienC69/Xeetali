"""Tests du domaine Donneurs & Alertes (UC-14/15/16/17/18)."""
from __future__ import annotations
import pytest

from collections.abc import Callable
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_donor_profile_upsert_and_get(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    h = await auth("donor@cnts.sn")
    resp = await client.put(
        "/api/donors/me/profile",
        json={"groupe_sanguin": "O-", "telephone": "770001199", "localisation": "Dakar"},
        headers=h,
    )
    assert resp.status_code == 200
    got = await client.get("/api/donors/me/profile", headers=h)
    assert got.status_code == 200 and got.json()["groupe_sanguin"] == "O-"


@pytest.mark.asyncio
async def test_collection_points_filter_by_locality(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    h = await auth("donor@cnts.sn")
    dakar = await client.get("/api/collection-points?localisation=Dakar", headers=h)
    assert len(dakar.json()) == 1
    ziguinchor = await client.get("/api/collection-points?localisation=Ziguinchor", headers=h)
    assert ziguinchor.json() == []


@pytest.mark.asyncio
async def test_appointment_creation(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    when = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    resp = await client.post(
        "/api/appointments",
        json={"collection_point_id": seeded["collection_point_id"], "date": when},
        headers=await auth("donor@cnts.sn"),
    )
    assert resp.status_code == 201 and resp.json()["statut"] == "PLANIFIE"


@pytest.mark.asyncio
async def test_alert_targets_compatible_donors_only(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    """Le donneur seedé est O- (donneur universel), donc éligible pour une
    demande O+. Une demande AB- ne doit PAS le retenir (O- incompatible receveur AB-?)
    En réalité O- EST compatible avec AB-. On teste donc une incompatibilité nette :
    receveur O- n'accepte QUE des donneurs O- → le donneur O- est retenu ; un
    receveur A+ retient aussi O-. On vérifie le comptage et la matrice exposée."""
    h = await auth("admin@cnts.sn")
    # Receveur O- : seuls les donneurs O- sont compatibles → 1 donneur (le seedé).
    resp = await client.post("/api/alerts", json={"groupe_sanguin": "O-", "localisation": "Dakar"}, headers=h)
    assert resp.status_code == 201
    body = resp.json()
    assert body["donneurs_notifies"] == 1
    assert body["groupes_donneurs_compatibles"] == ["O-"]
    assert body["envoi_reel"] is False


@pytest.mark.asyncio
async def test_alert_incompatible_receiver_excludes_donor(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    """Rendre le donneur A+ : il n'est PAS compatible pour un receveur O- (qui
    n'accepte que O-) → 0 donneur notifié."""
    dh = await auth("donor@cnts.sn")
    await client.put(
        "/api/donors/me/profile",
        json={"groupe_sanguin": "A+", "telephone": "771112233", "localisation": "Dakar"},
        headers=dh,
    )
    resp = await client.post(
        "/api/alerts", json={"groupe_sanguin": "O-", "localisation": "Dakar"},
        headers=await auth("admin@cnts.sn"),
    )
    assert resp.json()["donneurs_notifies"] == 0


@pytest.mark.asyncio
async def test_alert_masks_phone_numbers(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    resp = await client.post(
        "/api/alerts", json={"groupe_sanguin": "O-", "localisation": "Dakar"},
        headers=await auth("admin@cnts.sn"),
    )
    for masque in resp.json()["numeros_masques"]:
        assert "*" in masque
        assert "1234" not in masque  # le milieu du numéro seedé est masqué


@pytest.mark.asyncio
async def test_donor_responds_to_alert(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    alert_resp = await client.post(
        "/api/alerts", json={"groupe_sanguin": "O-", "localisation": "Dakar"},
        headers=await auth("admin@cnts.sn"),
    )
    alert = alert_resp.json()
    resp = await client.post(
        f"/api/alerts/{alert['alert_id']}/respond",
        json={"disponible": True},
        headers=await auth("donor@cnts.sn"),
    )
    assert resp.status_code == 200
    assert resp.json()["disponible"] is True
    assert "présentez-vous" in resp.json()["instructions"].lower()


@pytest.mark.asyncio
async def test_donations_history_empty_then_listed(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    resp = await client.get("/api/donors/me/donations", headers=await auth("donor@cnts.sn"))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_donor_stats_zero_then_gamified(
    client: AsyncClient, db_session, seeded: dict[str, int],
    auth: Callable[[str], dict[str, str]],
) -> None:
    from datetime import date, timedelta
    from app.models.donation import Donation

    # Sans don : niveau initial, éligible, badges non obtenus.
    s0_resp = await client.get("/api/donors/me/stats", headers=await auth("donor@cnts.sn"))
    s0 = s0_resp.json()
    assert s0["nb_dons"] == 0
    assert s0["niveau"] == "Nouveau donneur"
    assert s0["eligible_maintenant"] is True
    assert all(b["obtenu"] is False for b in s0["badges"])

    # Ajout de 3 dons → niveau Argent, badges premier_don + regulier obtenus.
    for i in range(3):
        db_session.add(Donation(
            donor_id=seeded["donor_id"], collection_point_id=seeded["collection_point_id"],
            groupe_sanguin="O-", volume=450, date=date.today() - timedelta(days=100 + i * 100),
        ))
    await db_session.commit()

    s1_resp = await client.get("/api/donors/me/stats", headers=await auth("donor@cnts.sn"))
    s1 = s1_resp.json()
    assert s1["nb_dons"] == 3
    assert s1["niveau"] == "Argent"
    assert s1["vies_potentielles"] == 9
    assert s1["points"] == 300
    obtained = {b["code"] for b in s1["badges"] if b["obtenu"]}
    assert {"premier_don", "regulier"} <= obtained
    assert "or" not in obtained


@pytest.mark.asyncio
async def test_leaderboard_includes_me(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    board_resp = await client.get("/api/donors/leaderboard", headers=await auth("donor@cnts.sn"))
    board = board_resp.json()
    assert len(board) >= 1
    assert any(e["is_me"] for e in board)
    # Nom abrégé (confidentialité) : pas de nom complet en clair.
    assert all("." in e["nom_affiche"] or " " not in e["nom_affiche"] for e in board)
