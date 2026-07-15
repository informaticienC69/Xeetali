"""Logique métier des rendez-vous de don (UC-16)."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.appointment import Appointment
from app.models.collection_point import CollectionPoint
from app.schemas.appointment import AppointmentCreate
from app.services.donor_service import get_profile
from app.services.exceptions import NotFoundError


async def create_appointment(db: AsyncSession, user_id: int, payload: AppointmentCreate) -> Appointment:
    """Prend un rendez-vous pour le donneur courant (atomique)."""
    profile = await get_profile(db, user_id)
    if await db.get(CollectionPoint, payload.collection_point_id) is None:
        raise NotFoundError(f"Point de collecte {payload.collection_point_id} introuvable.")
    try:
        appt = Appointment(
            donor_id=profile.id,
            collection_point_id=payload.collection_point_id,
            date=payload.date,
        )
        db.add(appt)
        await db.commit()
        await db.refresh(appt)
    except Exception:
        await db.rollback()
        raise
    return appt


async def list_appointments(db: AsyncSession, user_id: int) -> list[Appointment]:
    """Rendez-vous du donneur courant."""
    profile = await get_profile(db, user_id)
    result = await db.scalars(
        select(Appointment).where(Appointment.donor_id == profile.id).order_by(Appointment.date)
    )
    return list(result.all())
