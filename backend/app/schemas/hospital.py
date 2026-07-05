"""Schémas des établissements (administration)."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class HospitalCreate(BaseModel):
    """Création d'un établissement."""

    nom: str = Field(min_length=1, max_length=200)
    localisation: str = Field(min_length=1, max_length=200)
    type: str = Field(min_length=1, max_length=100)


class HospitalUpdate(BaseModel):
    """Mise à jour partielle d'un établissement."""

    nom: str | None = Field(default=None, min_length=1, max_length=200)
    localisation: str | None = Field(default=None, min_length=1, max_length=200)
    type: str | None = Field(default=None, min_length=1, max_length=100)


class HospitalRead(BaseModel):
    """Représentation d'un établissement."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nom: str
    localisation: str
    type: str
