"""Schémas de réponse pour l'inventaire (comptage en direct des poches DISPONIBLE)."""
from __future__ import annotations

from pydantic import BaseModel

from app.schemas.enums import BloodGroup


class StockLine(BaseModel):
    """Un groupe sanguin et le nombre de poches disponibles."""

    groupe_sanguin: BloodGroup
    quantite: int


class InventoryByHospital(BaseModel):
    """Stock d'un hôpital, agrégé en direct par groupe sanguin."""

    hospital_id: int
    nom: str
    region_nom: str
    type: str
    stocks: list[StockLine]
