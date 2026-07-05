"""Modèles Alert et AlertResponse — alertes donneurs (mock SMS/Push)."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.schemas.enums import AlertStatus


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Alert(Base):
    """Campagne d'alerte ciblant les donneurs compatibles (aucun envoi réel)."""

    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    groupe_sanguin: Mapped[str] = mapped_column(String(3), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    canal: Mapped[str] = mapped_column(String(10), nullable=False)
    portee: Mapped[str] = mapped_column(String(20), nullable=False)
    statut: Mapped[str] = mapped_column(String(20), nullable=False, default=AlertStatus.ACTIVE.value)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, nullable=False)


class AlertResponse(Base):
    """Réponse d'un donneur à une alerte (déclaration de disponibilité)."""

    __tablename__ = "alert_responses"

    id: Mapped[int] = mapped_column(primary_key=True)
    alert_id: Mapped[int] = mapped_column(ForeignKey("alerts.id"), nullable=False, index=True)
    donor_id: Mapped[int] = mapped_column(ForeignKey("donor_profiles.id"), nullable=False)
    disponible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, nullable=False)
