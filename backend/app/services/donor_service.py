"""Logique métier du donneur : profil (UC-14) et historique de dons (UC-18)."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.donation import Donation
from app.models.donor_profile import DonorProfile
from app.schemas.donor import DonorProfileUpsert
from app.services.exceptions import NotFoundError


def get_profile(db: Session, user_id: int) -> DonorProfile:
    """Récupère le profil donneur d'un utilisateur, ou lève 404."""
    profile = db.scalars(
        select(DonorProfile).where(DonorProfile.user_id == user_id)
    ).one_or_none()
    if profile is None:
        raise NotFoundError("Profil donneur introuvable. Créez-le d'abord.")
    return profile


def get_profile_or_none(db: Session, user_id: int) -> DonorProfile | None:
    return db.scalars(select(DonorProfile).where(DonorProfile.user_id == user_id)).one_or_none()


def upsert_profile(db: Session, user_id: int, payload: DonorProfileUpsert) -> DonorProfile:
    """Crée ou met à jour le profil donneur de l'utilisateur courant (atomique)."""
    try:
        profile = get_profile_or_none(db, user_id)
        if profile is None:
            profile = DonorProfile(user_id=user_id)
            db.add(profile)
        profile.groupe_sanguin = payload.groupe_sanguin.value
        profile.telephone = payload.telephone
        profile.localisation = payload.localisation
        profile.date_dernier_don = payload.date_dernier_don
        db.commit()
        db.refresh(profile)
    except Exception:
        db.rollback()
        raise
    return profile


def list_donations(db: Session, user_id: int) -> list[Donation]:
    """Historique des dons du donneur courant (UC-18)."""
    profile = get_profile(db, user_id)
    return list(
        db.scalars(
            select(Donation).where(Donation.donor_id == profile.id).order_by(Donation.date.desc())
        ).all()
    )
