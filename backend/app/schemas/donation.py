"""Schémas de l'historique des dons (UC-18)."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import BloodGroup


class DonationRead(BaseModel):
    """Représentation d'un don passé."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    donor_id: int
    collection_point_id: int
    groupe_sanguin: BloodGroup
    volume: int
    date: date
