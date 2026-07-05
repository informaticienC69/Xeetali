"""Schémas de réponse pour l'état des stocks (regroupés par hôpital)."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import BloodGroup


class StockLine(BaseModel):
    """Une ligne de stock : un groupe sanguin et sa quantité disponible."""

    model_config = ConfigDict(from_attributes=True)

    groupe_sanguin: BloodGroup
    quantite: int


class InventoryByHospital(BaseModel):
    """État des stocks d'un hôpital, agrégé par groupe sanguin."""

    hospital_id: int
    nom: str
    localisation: str
    type: str
    stocks: list[StockLine]
