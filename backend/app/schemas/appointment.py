"""Schémas des rendez-vous de don (UC-16)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import AppointmentStatus


class AppointmentCreate(BaseModel):
    """Prise de rendez-vous par le donneur courant."""

    collection_point_id: int
    date: datetime


class AppointmentRead(BaseModel):
    """Représentation d'un rendez-vous."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    donor_id: int
    collection_point_id: int
    date: datetime
    statut: AppointmentStatus
