"""Routes du donneur : profil (UC-14) et historique de dons (UC-18)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.donation import DonationRead
from app.schemas.donor import DonorProfileRead, DonorProfileUpsert
from app.schemas.enums import UserRole
from app.services import donor_service

router = APIRouter(prefix="/api/donors", tags=["donneurs"])

_donor = require_role(UserRole.DONNEUR)


@router.get("/me/profile", response_model=DonorProfileRead)
def get_my_profile(
    db: Session = Depends(get_db), current: User = Depends(_donor)
) -> DonorProfileRead:
    """Profil donneur de l'utilisateur courant (UC-14)."""
    return DonorProfileRead.model_validate(donor_service.get_profile(db, current.id))


@router.put("/me/profile", response_model=DonorProfileRead)
def upsert_my_profile(
    payload: DonorProfileUpsert,
    db: Session = Depends(get_db),
    current: User = Depends(_donor),
) -> DonorProfileRead:
    """Crée ou met à jour le profil donneur (UC-14)."""
    return DonorProfileRead.model_validate(
        donor_service.upsert_profile(db, current.id, payload)
    )


@router.get("/me/donations", response_model=list[DonationRead])
def my_donations(
    db: Session = Depends(get_db), current: User = Depends(_donor)
) -> list[DonationRead]:
    """Historique des dons du donneur courant (UC-18)."""
    return [DonationRead.model_validate(d) for d in donor_service.list_donations(db, current.id)]
