"""Modèle Appointment — rendez-vous de don."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.schemas.enums import AppointmentStatus


class Appointment(Base):
    """Rendez-vous d'un donneur sur un point de collecte."""

    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    donor_id: Mapped[int] = mapped_column(ForeignKey("donor_profiles.id"), nullable=False, index=True)
    collection_point_id: Mapped[int] = mapped_column(
        ForeignKey("collection_points.id"), nullable=False
    )
    date: Mapped[datetime] = mapped_column(nullable=False)
    statut: Mapped[str] = mapped_column(
        String(20), nullable=False, default=AppointmentStatus.PLANIFIE.value
    )
