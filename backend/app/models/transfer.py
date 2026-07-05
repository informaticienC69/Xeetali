"""Modèle Ordre de transfert (trace d'audit d'un mouvement de stock UC-04)."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.schemas.enums import TransferStatus


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TransferOrder(Base):
    """Ordre de transfert de poches entre deux hôpitaux.

    Persisté comme trace d'audit médical : tout mouvement de stock validé
    correspond à un enregistrement horodaté ``COMPLETED``.
    """

    __tablename__ = "transfer_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_hospital_id: Mapped[int] = mapped_column(ForeignKey("hospitals.id"), nullable=False)
    target_hospital_id: Mapped[int] = mapped_column(ForeignKey("hospitals.id"), nullable=False)
    groupe_sanguin: Mapped[str] = mapped_column(String(3), nullable=False)
    quantite: Mapped[int] = mapped_column(nullable=False)
    statut: Mapped[str] = mapped_column(String(20), nullable=False, default=TransferStatus.PENDING.value)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, nullable=False)
