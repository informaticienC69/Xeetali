"""Routes des rendez-vous de don (UC-16)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentRead
from app.schemas.enums import UserRole
from app.services import appointment_service

router = APIRouter(prefix="/api/appointments", tags=["rendez-vous"])

_donor = require_role(UserRole.DONNEUR)


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(_donor),
) -> AppointmentRead:
    """Prend un rendez-vous de don (UC-16)."""
    return AppointmentRead.model_validate(
        await appointment_service.create_appointment(db, current.id, payload)
    )


@router.get("", response_model=list[AppointmentRead])
async def my_appointments(
    db: AsyncSession = Depends(get_db), current: User = Depends(_donor)
) -> list[AppointmentRead]:
    """Rendez-vous du donneur courant."""
    return [
        AppointmentRead.model_validate(a)
        for a in await appointment_service.list_appointments(db, current.id)
    ]
