"""Routes des poches de sang (UC-08, statut, recherche, validité)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.enums import BloodGroup, PouchStatus, UserRole
from app.schemas.pouch import PouchCreate, PouchRead, PouchStatusUpdate, PouchValidity
from app.services import pouch_service

router = APIRouter(prefix="/api/pouches", tags=["poches"])

_medical = require_role(UserRole.PERSONNEL_MEDICAL, UserRole.ADMIN_CNTS)


@router.post("", response_model=PouchRead, status_code=status.HTTP_201_CREATED)
async def register_pouch(
    payload: PouchCreate, db: AsyncSession = Depends(get_db), _: User = Depends(_medical)
) -> PouchRead:
    """UC-08 : enregistre une poche (UID + QR générés)."""
    return PouchRead.model_validate(await pouch_service.register_pouch(db, payload))


@router.get("/search", response_model=list[PouchRead])
async def search_pouches(
    groupe_sanguin: BloodGroup | None = None,
    hospital_id: int | None = None,
    statut: PouchStatus | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[PouchRead]:
    """Recherche de poches (urgence) par groupe / hôpital / statut."""
    pouches = await pouch_service.search_pouches(
        db,
        groupe_sanguin=groupe_sanguin.value if groupe_sanguin else None,
        hospital_id=hospital_id,
        statut=statut.value if statut else None,
    )
    return [PouchRead.model_validate(p) for p in pouches]


@router.get("/{uid}/validity", response_model=PouchValidity)
async def check_validity(
    uid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)
) -> PouchValidity:
    """Vérifie l'existence en base + péremption d'une poche."""
    return await pouch_service.check_validity(db, uid)


@router.patch("/{uid}/status", response_model=PouchRead)
async def update_status(
    uid: str,
    payload: PouchStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_medical),
) -> PouchRead:
    """Change le statut d'une poche (journalisé)."""
    return PouchRead.model_validate(await pouch_service.update_status(db, uid, payload.statut))
