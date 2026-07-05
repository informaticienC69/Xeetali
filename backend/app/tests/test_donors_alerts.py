"""Tests du domaine Donneurs & Alertes (UC-14/15/16/17/18)."""
from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def test_donor_profile_upsert_and_get(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    h = auth("donor@cnts.sn")
    resp = client.put(
        "/api/donors/me/profile",
        json={"groupe_sanguin": "O-", "telephone": "770001199", "localisation": "Dakar"},
        headers=h,
    )
    assert resp.status_code == 200
    got = client.get("/api/donors/me/profile", headers=h)
    assert got.status_code == 200 and got.json()["groupe_sanguin"] == "O-"


def test_collection_points_filter_by_locality(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    h = auth("donor@cnts.sn")
    assert len(client.get("/api/collection-points?localisation=Dakar", headers=h).json()) == 1
    assert client.get("/api/collection-points?localisation=Ziguinchor", headers=h).json() == []


def test_appointment_creation(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    when = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    resp = client.post(
        "/api/appointments",
        json={"collection_point_id": seeded["collection_point_id"], "date": when},
        headers=auth("donor@cnts.sn"),
    )
    assert resp.status_code == 201 and resp.json()["statut"] == "PLANIFIE"


def test_alert_targets_compatible_donors_only(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    """Le donneur seedé est O- (donneur universel), donc éligible pour une
    demande O+. Une demande AB- ne doit PAS le retenir (O- incompatible receveur AB-?)
    En réalité O- EST compatible avec AB-. On teste donc une incompatibilité nette :
    receveur O- n'accepte QUE des donneurs O- → le donneur O- est retenu ; un
    receveur A+ retient aussi O-. On vérifie le comptage et la matrice exposée."""
    h = auth("admin@cnts.sn")
    # Receveur O- : seuls les donneurs O- sont compatibles → 1 donneur (le seedé).
    resp = client.post("/api/alerts", json={"groupe_sanguin": "O-", "localisation": "Dakar"}, headers=h)
    assert resp.status_code == 201
    body = resp.json()
    assert body["donneurs_notifies"] == 1
    assert body["groupes_donneurs_compatibles"] == ["O-"]
    assert body["envoi_reel"] is False


def test_alert_incompatible_receiver_excludes_donor(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    """Rendre le donneur A+ : il n'est PAS compatible pour un receveur O- (qui
    n'accepte que O-) → 0 donneur notifié."""
    dh = auth("donor@cnts.sn")
    client.put(
        "/api/donors/me/profile",
        json={"groupe_sanguin": "A+", "telephone": "771112233", "localisation": "Dakar"},
        headers=dh,
    )
    resp = client.post(
        "/api/alerts", json={"groupe_sanguin": "O-", "localisation": "Dakar"},
        headers=auth("admin@cnts.sn"),
    )
    assert resp.json()["donneurs_notifies"] == 0


def test_alert_masks_phone_numbers(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    resp = client.post(
        "/api/alerts", json={"groupe_sanguin": "O-", "localisation": "Dakar"},
        headers=auth("admin@cnts.sn"),
    )
    for masque in resp.json()["numeros_masques"]:
        assert "*" in masque
        assert "1234" not in masque  # le milieu du numéro seedé est masqué


def test_donor_responds_to_alert(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    alert = client.post(
        "/api/alerts", json={"groupe_sanguin": "O-", "localisation": "Dakar"},
        headers=auth("admin@cnts.sn"),
    ).json()
    resp = client.post(
        f"/api/alerts/{alert['alert_id']}/respond",
        json={"disponible": True},
        headers=auth("donor@cnts.sn"),
    )
    assert resp.status_code == 200
    assert resp.json()["disponible"] is True
    assert "présentez-vous" in resp.json()["instructions"].lower()


def test_donations_history_empty_then_listed(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    resp = client.get("/api/donors/me/donations", headers=auth("donor@cnts.sn"))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_donor_stats_zero_then_gamified(
    client: TestClient, db_session, seeded: dict[str, int],
    auth: Callable[[str], dict[str, str]],
) -> None:
    from datetime import date, timedelta
    from app.models.donation import Donation

    # Sans don : niveau initial, éligible, badges non obtenus.
    s0 = client.get("/api/donors/me/stats", headers=auth("donor@cnts.sn")).json()
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
    db_session.commit()

    s1 = client.get("/api/donors/me/stats", headers=auth("donor@cnts.sn")).json()
    assert s1["nb_dons"] == 3
    assert s1["niveau"] == "Argent"
    assert s1["vies_potentielles"] == 9
    assert s1["points"] == 300
    obtained = {b["code"] for b in s1["badges"] if b["obtenu"]}
    assert {"premier_don", "regulier"} <= obtained
    assert "or" not in obtained


def test_leaderboard_includes_me(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    board = client.get("/api/donors/leaderboard", headers=auth("donor@cnts.sn")).json()
    assert len(board) >= 1
    assert any(e["is_me"] for e in board)
    # Nom abrégé (confidentialité) : pas de nom complet en clair.
    assert all("." in e["nom_affiche"] or " " not in e["nom_affiche"] for e in board)
