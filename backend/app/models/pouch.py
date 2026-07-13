"""Modèle BloodPouch — poche de sang, **unique source de vérité du stock**."""
from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import ForeignKey, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.schemas.enums import PouchStatus


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class BloodPouch(Base):
    """Une poche de sang physique, tracée par UID unique et QR Code.

    Le « stock » d'un hôpital pour un groupe = comptage des poches ``DISPONIBLE``
    de ce groupe et de cet hôpital. Aucune colonne quantité à synchroniser.
    """

    __tablename__ = "blood_pouches"
    __table_args__ = (
        Index("idx_inventory", "hospital_id", "groupe_sanguin", "statut"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    uid: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    groupe_sanguin: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    hospital_id: Mapped[int] = mapped_column(ForeignKey("hospitals.id"), nullable=False, index=True)
    statut: Mapped[str] = mapped_column(
        String(20), nullable=False, default=PouchStatus.DISPONIBLE.value, index=True
    )
    date_prelevement: Mapped[date] = mapped_column(nullable=False)
    date_peremption: Mapped[date] = mapped_column(nullable=False, index=True)
    qr_code_b64: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, nullable=False)
