"""Routes du donneur : profil (UC-14) et historique de dons (UC-18)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.donation import DonationRead
from app.schemas.donor import (
    DonorProfileRead,
    DonorProfileUpsert,
    DonorStats,
    LeaderboardEntry,
    UrgencyStats,
)
from app.schemas.enums import UserRole
from app.services import donor_service

router = APIRouter(prefix="/api/donors", tags=["donneurs"])

_donor = require_role(UserRole.DONNEUR)


@router.get("/me/profile", response_model=DonorProfileRead)
async def get_my_profile(
    db: AsyncSession = Depends(get_db), current: User = Depends(_donor)
) -> DonorProfileRead:
    """Profil donneur de l'utilisateur courant (UC-14)."""
    return DonorProfileRead.model_validate(await donor_service.get_profile(db, current.id))


@router.put("/me/profile", response_model=DonorProfileRead)
async def upsert_my_profile(
    payload: DonorProfileUpsert,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(_donor),
) -> DonorProfileRead:
    """Crée ou met à jour le profil donneur (UC-14)."""
    return DonorProfileRead.model_validate(
        await donor_service.upsert_profile(db, current.id, payload)
    )


@router.get("/me/donations", response_model=list[DonationRead])
async def my_donations(
    db: AsyncSession = Depends(get_db), current: User = Depends(_donor)
) -> list[DonationRead]:
    """Historique des dons du donneur courant (UC-18)."""
    return [DonationRead.model_validate(d) for d in await donor_service.list_donations(db, current.id)]


@router.get("/me/stats", response_model=DonorStats)
async def my_stats(db: AsyncSession = Depends(get_db), current: User = Depends(_donor)) -> DonorStats:
    """Statistiques gamifiées (niveau, badges, rang, éligibilité) du donneur."""
    return await donor_service.get_stats(db, current.id)


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    db: AsyncSession = Depends(get_db), current: User = Depends(_donor)
) -> list[LeaderboardEntry]:
    """Classement des meilleurs donneurs (noms abrégés)."""
    return await donor_service.leaderboard(db, current.id)


@router.get("/urgency", response_model=UrgencyStats)
async def get_urgency(db: AsyncSession = Depends(get_db)) -> UrgencyStats:
    """Récupère les statistiques d'urgence nationale en temps réel."""
    return await donor_service.get_urgency_stats(db)
