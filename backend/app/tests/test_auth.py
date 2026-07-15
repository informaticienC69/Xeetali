"""Tests du domaine Authentification & contrôle d'accès par rôle."""
from __future__ import annotations
import pytest

from collections.abc import Callable

from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_register_returns_token(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/auth/register",
        json={"nom": "Aïcha", "email": "aicha@cnts.sn", "password": "Password123!", "role": "DONNEUR"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["access_token"]
    assert body["role"] == "DONNEUR"


@pytest.mark.asyncio
async def test_register_ignores_client_supplied_role(client: AsyncClient) -> None:
    """Régression : l'auto-inscription publique ne doit jamais créer un compte privilégié,
    même si le client envoie un champ ``role`` (ex. ``ADMIN_CNTS``) dans la requête.
    """
    resp = await client.post(
        "/api/auth/register",
        json={"nom": "Attaquant", "email": "attaquant@cnts.sn", "password": "Password123!", "role": "ADMIN_CNTS"},
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "DONNEUR"


@pytest.mark.asyncio
async def test_register_duplicate_email_conflict(client: AsyncClient, seeded: dict[str, int]) -> None:
    resp = await client.post(
        "/api/auth/register",
        json={"nom": "X", "email": "admin@cnts.sn", "password": "Password123!", "role": "ADMIN_CNTS"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_invalid_password_422(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/auth/register",
        json={"nom": "X", "email": "x@cnts.sn", "password": "court", "role": "DONNEUR"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_success_and_wrong_password(client: AsyncClient, seeded: dict[str, int]) -> None:
    ok = await client.post("/api/auth/login", json={"email": "admin@cnts.sn", "password": "Password123!"})
    assert ok.status_code == 200
    bad = await client.post("/api/auth/login", json={"email": "admin@cnts.sn", "password": "faux"})
    assert bad.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_requires_auth(client: AsyncClient, seeded: dict[str, int]) -> None:
    resp = await client.get("/api/inventory")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_role_enforced_403(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    # Un donneur ne peut pas lancer un transfert (réservé ADMIN_CNTS).
    payload = {
        "source_hospital_id": seeded["source_id"],
        "target_hospital_id": seeded["target_id"],
        "groupe_sanguin": "O+",
        "quantite": 1,
    }
    resp = await client.post("/api/transfers", json=payload, headers=await auth("donor@cnts.sn"))
    assert resp.status_code == 403
