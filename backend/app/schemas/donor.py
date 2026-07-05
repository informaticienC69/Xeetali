"""Schémas du profil donneur (UC-14)."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import BloodGroup


class DonorProfileUpsert(BaseModel):
    """Création / mise à jour du profil donneur de l'utilisateur courant."""

    groupe_sanguin: BloodGroup
    telephone: str = Field(min_length=6, max_length=20)
    localisation: str = Field(min_length=1, max_length=200)
    date_dernier_don: date | None = None


class DonorProfileRead(BaseModel):
    """Représentation du profil donneur."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    groupe_sanguin: BloodGroup
    telephone: str
    localisation: str
    date_dernier_don: date | None
