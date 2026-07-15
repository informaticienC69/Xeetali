"""Logique métier des demandes de sang."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hospital import Hospital
from app.models.request import BloodRequest
from app.schemas.request import RequestCreate
from app.services.exceptions import HospitalNotFoundError


async def create_request(db: AsyncSession, payload: RequestCreate, user_id: int) -> BloodRequest:
    """Émet une demande de sang (atomique)."""
    if await db.get(Hospital, payload.hospital_id) is None:
        raise HospitalNotFoundError(f"Hôpital {payload.hospital_id} introuvable.")
    try:
        req = BloodRequest(
            hospital_id=payload.hospital_id,
            groupe_sanguin=payload.groupe_sanguin.value,
            quantite=payload.quantite,
            urgence=payload.urgence.value,
            created_by=user_id,
        )
        db.add(req)
        await db.commit()
        await db.refresh(req)
    except Exception:
        await db.rollback()
        raise
    return req


async def list_requests(db: AsyncSession) -> list[BloodRequest]:
    """Liste les demandes, plus récentes d'abord."""
    return list((await db.scalars(select(BloodRequest).order_by(BloodRequest.created_at.desc()))).all())
