"""Schémas des régions administratives (référence géographique)."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class RegionRead(BaseModel):
    """Représentation d'une région."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nom: str
    capitale: str
    population: int
    longitude: float
    latitude: float
