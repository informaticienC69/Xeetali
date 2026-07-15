"""Tests du domaine Transferts & Demandes (UC-04)."""
from __future__ import annotations
import pytest

from collections.abc import Callable

from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pouch import BloodPouch
from app.models.transfer import TransferOrder
from app.schemas.enums import PouchStatus


async def _available(db: AsyncSession, hospital_id: int, groupe: str) -> int:
    return int(
        await db.scalar(
            select(func.count(BloodPouch.id)).where(
                BloodPouch.hospital_id == hospital_id,
                BloodPouch.groupe_sanguin == groupe,
                BloodPouch.statut == PouchStatus.DISPONIBLE.value,
            )
        )
        or 0
    )


@pytest.mark.asyncio
async def test_transfer_insufficient_stock_409_no_change(
    client: AsyncClient, db_session: AsyncSession, seeded: dict[str, int],
    auth: Callable[[str], dict[str, str]],
) -> None:
    src, tgt = seeded["source_id"], seeded["target_id"]
    payload = {"source_hospital_id": src, "target_hospital_id": tgt, "groupe_sanguin": "O+", "quantite": 99}
    resp = await client.post("/api/transfers", json=payload, headers=await auth("admin@cnts.sn"))
    assert resp.status_code == 409

    # Aucune poche déplacée, aucun ordre créé.
    assert await _available(db_session, src, "O+") == 5
    assert await _available(db_session, tgt, "O+") == 0
    orders = (await db_session.scalars(select(TransferOrder))).all()
    assert orders == []


@pytest.mark.asyncio
async def test_transfer_success_moves_pouches(
    client: AsyncClient, db_session: AsyncSession, seeded: dict[str, int],
    auth: Callable[[str], dict[str, str]],
) -> None:
    src, tgt = seeded["source_id"], seeded["target_id"]
    payload = {"source_hospital_id": src, "target_hospital_id": tgt, "groupe_sanguin": "O+", "quantite": 3}
    resp = await client.post("/api/transfers", json=payload, headers=await auth("admin@cnts.sn"))
    assert resp.status_code == 201
    assert resp.json()["statut"] == "COMPLETED"

    db_session.expire_all()
    assert await _available(db_session, src, "O+") == 2   # 5 - 3
    assert await _available(db_session, tgt, "O+") == 3   # 0 + 3

    orders = (await db_session.scalars(select(TransferOrder))).all()
    assert len(orders) == 1 and orders[0].quantite == 3


@pytest.mark.asyncio
async def test_transfer_same_source_target_422(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    payload = {
        "source_hospital_id": seeded["source_id"],
        "target_hospital_id": seeded["source_id"],
        "groupe_sanguin": "O+",
        "quantite": 1,
    }
    resp = await client.post("/api/transfers", json=payload, headers=await auth("admin@cnts.sn"))
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_transfer_nonexistent_hospital_404(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    payload = {
        "source_hospital_id": seeded["source_id"],
        "target_hospital_id": 999999,
        "groupe_sanguin": "O+",
        "quantite": 1,
    }
    resp = await client.post("/api/transfers", json=payload, headers=await auth("admin@cnts.sn"))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_blood_request(
    client: AsyncClient, seeded: dict[str, int], auth: Callable[[str], dict[str, str]]
) -> None:
    payload = {
        "hospital_id": seeded["target_id"],
        "groupe_sanguin": "O-",
        "quantite": 4,
        "urgence": "CRITIQUE",
    }
    resp = await client.post("/api/requests", json=payload, headers=await auth("medic@cnts.sn"))
    assert resp.status_code == 201
    assert resp.json()["statut"] == "OUVERTE"
