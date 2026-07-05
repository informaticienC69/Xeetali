"""Schémas des points de collecte."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class CollectionPointCreate(BaseModel):
    """Création d'un point de collecte."""

    nom: str = Field(min_length=1, max_length=200)
    localisation: str = Field(min_length=1, max_length=200)
    hospital_id: int | None = None
    horaires: str = "Lun-Ven 08h-16h"


class CollectionPointRead(BaseModel):
    """Représentation d'un point de collecte."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nom: str
    localisation: str
    hospital_id: int | None
    horaires: str
