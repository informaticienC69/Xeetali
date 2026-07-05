"""Tests du domaine Authentification & contrôle d'accès par rôle."""
from __future__ import annotations

from collections.abc import Callable

from fastapi.testclient import TestClient


def test_register_returns_token(client: TestClient) -> None:
    resp = client.post(
        "/api/auth/register",
        json={"nom": "Aïcha", "email": "aicha@cnts.sn", "password": "Password123!", "role": "DONNEUR"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["access_token"]
    assert body["role"] == "DONNEUR"


def test_register_duplicate_email_conflict(client: TestClient, seeded: dict[str, int]) -> None:
    resp = client.post(
        "/api/auth/register",
        json={"nom": "X", "email": "admin@cnts.sn", "password": "Password123!", "role": "ADMIN_CNTS"},
    )
    assert resp.status_code == 409


def test_register_invalid_password_422(client: TestClient) -> None:
    resp = client.post(
        "/api/auth/register",
        json={"nom": "X", "email": "x@cnts.sn", "password": "court", "role": "DONNEUR"},
    )
    assert resp.status_code == 422


def test_login_success_and_wrong_password(client: TestClient, seeded: dict[str, int]) -> None:
    ok = client.post("/api/auth/login", json={"email": "admin@cnts.sn", "password": "Password123!"})
    assert ok.status_code == 200
    bad = client.post("/api/auth/login", json={"email": "admin@cnts.sn", "password": "faux"})
    assert bad.status_code == 401


def test_protected_route_requires_auth(client: TestClient, seeded: dict[str, int]) -> None:
    assert client.get("/api/inventory").status_code == 401


def test_role_enforced_403(
    client: TestClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    # Un donneur ne peut pas lancer un transfert (réservé ADMIN_CNTS).
    payload = {
        "source_hospital_id": seeded["source_id"],
        "target_hospital_id": seeded["target_id"],
        "groupe_sanguin": "O+",
        "quantite": 1,
    }
    resp = client.post("/api/transfers", json=payload, headers=auth("donor@cnts.sn"))
    assert resp.status_code == 403
