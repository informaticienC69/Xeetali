"""Tests du domaine Stock & Poches (UC-08, inventaire, validité)."""
from __future__ import annotations

from collections.abc import Callable
from datetime import date, timedelta

from fastapi.testclient import TestClient


def _register_payload(hospital_id: int, groupe: str = "O+") -> dict:
    today = date.today()
    return {
        "groupe_sanguin": groupe,
        "hospital_id": hospital_id,
        "date_prelevement": today.isoformat(),
        "date_peremption": (today + timedelta(days=42)).isoformat(),
    }


def test_register_pouch_generates_uid_and_qr(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    resp = client.post(
        "/api/pouches", json=_register_payload(seeded["source_id"]), headers=auth("medic@cnts.sn")
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["uid"].startswith("XEE-")
    assert body["qr_code_b64"].startswith("data:image/png;base64,")
    assert body["statut"] == "DISPONIBLE"


def test_register_pouch_uid_is_unique(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    h = auth("medic@cnts.sn")
    uids = {
        client.post("/api/pouches", json=_register_payload(seeded["source_id"]), headers=h).json()["uid"]
        for _ in range(5)
    }
    assert len(uids) == 5  # tous distincts


def test_register_pouch_incoherent_dates_422(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    today = date.today()
    payload = {
        "groupe_sanguin": "O+",
        "hospital_id": seeded["source_id"],
        "date_prelevement": today.isoformat(),
        "date_peremption": (today - timedelta(days=1)).isoformat(),
    }
    resp = client.post("/api/pouches", json=payload, headers=auth("medic@cnts.sn"))
    assert resp.status_code == 422


def test_inventory_reflects_available_pouches(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    resp = client.get("/api/inventory", headers=auth("admin@cnts.sn"))
    assert resp.status_code == 200
    source = next(h for h in resp.json() if h["hospital_id"] == seeded["source_id"])
    o_pos = next(s for s in source["stocks"] if s["groupe_sanguin"] == "O+")
    assert o_pos["quantite"] == 5  # 5 poches DISPONIBLE seedées


def test_status_change_removes_from_available_stock(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    h = auth("medic@cnts.sn")
    # Passer une poche O+ à UTILISEE → le stock disponible baisse de 1.
    client.patch("/api/pouches/SEED-OP-0/status", json={"statut": "UTILISEE"}, headers=h)
    resp = client.get("/api/inventory", headers=h)
    source = next(x for x in resp.json() if x["hospital_id"] == seeded["source_id"])
    o_pos = next(s for s in source["stocks"] if s["groupe_sanguin"] == "O+")
    assert o_pos["quantite"] == 4


def test_validity_known_unknown_and_expired(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    h = auth("medic@cnts.sn")
    known = client.get("/api/pouches/SEED-OP-1/validity", headers=h).json()
    assert known["existe"] is True and known["valide"] is True

    unknown = client.get("/api/pouches/INCONNU-XYZ/validity", headers=h).json()
    assert unknown["existe"] is False and unknown["valide"] is False

    # Créer une poche déjà périmée n'est pas permis via l'API (dates cohérentes) ;
    # on marque une poche PERIMEE pour vérifier le signalement.
    client.patch("/api/pouches/SEED-OP-2/status", json={"statut": "PERIMEE"}, headers=h)
    expired = client.get("/api/pouches/SEED-OP-2/validity", headers=h).json()
    assert expired["valide"] is False and expired["perimee"] is True
