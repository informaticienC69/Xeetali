"""Modèle Inventaire de poches de sang par hôpital et groupe sanguin."""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.hospital import Hospital


class BloodInventory(Base):
    """Quantité de poches disponibles pour un (hôpital, groupe sanguin) donné.

    L'unicité ``(hospital_id, groupe_sanguin)`` garantit une seule ligne de stock
    par couple, évitant les incohérences lors des décréments/incréments.
    """

    __tablename__ = "blood_inventories"
    __table_args__ = (
        UniqueConstraint("hospital_id", "groupe_sanguin", name="uq_hospital_groupe"),
        CheckConstraint("quantite >= 0", name="ck_quantite_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    hospital_id: Mapped[int] = mapped_column(
        ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    groupe_sanguin: Mapped[str] = mapped_column(String(3), nullable=False)
    quantite: Mapped[int] = mapped_column(nullable=False, default=0)

    hospital: Mapped["Hospital"] = relationship(back_populates="inventories")
