"""Schémas des établissements (administration)."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.region import RegionRead


class HospitalCreate(BaseModel):
    """Création d'un établissement."""

    nom: str = Field(min_length=1, max_length=200)
    region_id: int
    type: str = Field(min_length=1, max_length=100)


class HospitalUpdate(BaseModel):
    """Mise à jour partielle d'un établissement."""

    nom: str | None = Field(default=None, min_length=1, max_length=200)
    region_id: int | None = None
    type: str | None = Field(default=None, min_length=1, max_length=100)


class HospitalRead(BaseModel):
    """Représentation d'un établissement."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nom: str
    region_id: int
    region: RegionRead
    type: str
