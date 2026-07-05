"""Modèle BloodRequest — demande de sang émise par un établissement."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.schemas.enums import RequestStatus, Urgence


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class BloodRequest(Base):
    """Demande de N poches d'un groupe donné pour un hôpital."""

    __tablename__ = "blood_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    hospital_id: Mapped[int] = mapped_column(ForeignKey("hospitals.id"), nullable=False, index=True)
    groupe_sanguin: Mapped[str] = mapped_column(String(3), nullable=False)
    quantite: Mapped[int] = mapped_column(nullable=False)
    urgence: Mapped[str] = mapped_column(String(20), nullable=False, default=Urgence.NORMALE.value)
    statut: Mapped[str] = mapped_column(String(20), nullable=False, default=RequestStatus.OUVERTE.value)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, nullable=False)
