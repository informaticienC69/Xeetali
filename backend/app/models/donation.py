"""Modèle Donation — historique des dons d'un donneur (UC-18)."""
from __future__ import annotations

from datetime import date

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Donation(Base):
    """Un don effectué par un donneur sur un point de collecte."""

    __tablename__ = "donations"

    id: Mapped[int] = mapped_column(primary_key=True)
    donor_id: Mapped[int] = mapped_column(ForeignKey("donor_profiles.id"), nullable=False, index=True)
    collection_point_id: Mapped[int] = mapped_column(
        ForeignKey("collection_points.id"), nullable=False
    )
    groupe_sanguin: Mapped[str] = mapped_column(String(3), nullable=False)
    volume: Mapped[int] = mapped_column(nullable=False, default=450)  # ml
    date: Mapped[date] = mapped_column(nullable=False)
