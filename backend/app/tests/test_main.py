"""Tests du Node Central Xéétali (UC-04 transferts, UC-17 alertes)."""
from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inventory import BloodInventory
from app.models.transfer import TransferOrder


def _stock(db: Session, hospital_id: int, groupe: str) -> int:
    line = db.scalars(
        select(BloodInventory).where(
            BloodInventory.hospital_id == hospital_id,
            BloodInventory.groupe_sanguin == groupe,
        )
    ).one_or_none()
    return line.quantite if line else 0


# --------------------------------------------------------------------------- #
# Inventaire
# --------------------------------------------------------------------------- #
def test_get_inventory_returns_data(client: TestClient, seeded: dict[str, int]) -> None:
    resp = client.get("/api/inventory")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    source = next(h for h in data if h["hospital_id"] == seeded["source_id"])
    o_pos = next(s for s in source["stocks"] if s["groupe_sanguin"] == "O+")
    assert o_pos["quantite"] == 10


# --------------------------------------------------------------------------- #
# UC-04 — Transfert : échec pour stock insuffisant (409, aucune modification)
# --------------------------------------------------------------------------- #
def test_transfer_insufficient_stock_returns_409_and_no_change(
    client: TestClient, db_session: Session, seeded: dict[str, int]
) -> None:
    src, tgt = seeded["source_id"], seeded["target_id"]
    payload = {
        "source_hospital_id": src,
        "target_hospital_id": tgt,
        "groupe_sanguin": "O+",
        "quantite": 999,  # > 10 disponibles
    }
    resp = client.post("/api/transfers", json=payload)
    assert resp.status_code == 409

    # Aucun stock modifié, aucun ordre créé.
    assert _stock(db_session, src, "O+") == 10
    assert _stock(db_session, tgt, "O+") == 2
    assert db_session.scalars(select(TransferOrder)).all() == []


# --------------------------------------------------------------------------- #
# UC-04 — Transfert réussi : source décrémentée ET cible incrémentée
# --------------------------------------------------------------------------- #
def test_transfer_success_updates_both_sides(
    client: TestClient, db_session: Session, seeded: dict[str, int]
) -> None:
    src, tgt = seeded["source_id"], seeded["target_id"]
    payload = {
        "source_hospital_id": src,
        "target_hospital_id": tgt,
        "groupe_sanguin": "O+",
        "quantite": 4,
    }
    resp = client.post("/api/transfers", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["statut"] == "COMPLETED"
    assert body["quantite"] == 4

    db_session.expire_all()
    assert _stock(db_session, src, "O+") == 6   # 10 - 4
    assert _stock(db_session, tgt, "O+") == 6   # 2 + 4

    orders = db_session.scalars(select(TransferOrder)).all()
    assert len(orders) == 1
    assert orders[0].statut == "COMPLETED"


def test_transfer_success_creates_target_line_when_absent(
    client: TestClient, db_session: Session, seeded: dict[str, int]
) -> None:
    """La cible n'a pas de stock A+ → une ligne doit être créée."""
    src, tgt = seeded["source_id"], seeded["target_id"]
    assert _stock(db_session, tgt, "A+") == 0

    payload = {
        "source_hospital_id": src,
        "target_hospital_id": tgt,
        "groupe_sanguin": "A+",
        "quantite": 5,
    }
    resp = client.post("/api/transfers", json=payload)
    assert resp.status_code == 201

    db_session.expire_all()
    assert _stock(db_session, src, "A+") == 0   # 5 - 5
    assert _stock(db_session, tgt, "A+") == 5   # ligne créée


# --------------------------------------------------------------------------- #
# Validation stricte des entrées
# --------------------------------------------------------------------------- #
def test_transfer_unknown_blood_group_returns_422(
    client: TestClient, seeded: dict[str, int]
) -> None:
    payload = {
        "source_hospital_id": seeded["source_id"],
        "target_hospital_id": seeded["target_id"],
        "groupe_sanguin": "Z+",
        "quantite": 1,
    }
    assert client.post("/api/transfers", json=payload).status_code == 422


def test_transfer_non_positive_quantity_returns_422(
    client: TestClient, seeded: dict[str, int]
) -> None:
    for bad in (0, -3):
        payload = {
            "source_hospital_id": seeded["source_id"],
            "target_hospital_id": seeded["target_id"],
            "groupe_sanguin": "O+",
            "quantite": bad,
        }
        assert client.post("/api/transfers", json=payload).status_code == 422


def test_transfer_same_source_and_target_returns_422(
    client: TestClient, seeded: dict[str, int]
) -> None:
    payload = {
        "source_hospital_id": seeded["source_id"],
        "target_hospital_id": seeded["source_id"],
        "groupe_sanguin": "O+",
        "quantite": 1,
    }
    assert client.post("/api/transfers", json=payload).status_code == 422


def test_transfer_nonexistent_hospital_returns_404(
    client: TestClient, seeded: dict[str, int]
) -> None:
    payload = {
        "source_hospital_id": seeded["source_id"],
        "target_hospital_id": 999999,  # inexistant
        "groupe_sanguin": "O+",
        "quantite": 1,
    }
    assert client.post("/api/transfers", json=payload).status_code == 404


# --------------------------------------------------------------------------- #
# UC-17 — Alerte USSD/SMS (mock)
# --------------------------------------------------------------------------- #
def test_ussd_alert_returns_expected_structure(client: TestClient) -> None:
    resp = client.post("/api/alerts/ussd", json={"groupe_sanguin": "O-"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["groupe_sanguin"] == "O-"
    assert body["envoi_reel"] is False
    assert body["canal"] == "USSD/SMS (simulé)"
    assert body["donneurs_notifies"] == len(body["numeros_masques"])
    # Confidentialité : aucun numéro en clair (masquage présent, pas 9 chiffres bruts).
    for masque in body["numeros_masques"]:
        assert "*" in masque
        assert masque.count("*") >= 1


def test_ussd_alert_invalid_group_returns_422(client: TestClient) -> None:
    assert client.post("/api/alerts/ussd", json={"groupe_sanguin": "XX"}).status_code == 422
