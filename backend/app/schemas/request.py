"""Schémas des demandes de sang."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, PositiveInt

from app.schemas.enums import BloodGroup, RequestStatus, Urgence


class RequestCreate(BaseModel):
    """Émission d'une demande de sang par un établissement."""

    hospital_id: int
    groupe_sanguin: BloodGroup
    quantite: PositiveInt
    urgence: Urgence = Urgence.NORMALE


class RequestRead(BaseModel):
    """Représentation d'une demande de sang."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    hospital_id: int
    groupe_sanguin: BloodGroup
    quantite: int
    urgence: Urgence
    statut: RequestStatus
    created_by: int
    created_at: datetime
