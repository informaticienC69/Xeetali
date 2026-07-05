"""Modèle CollectionPoint — point de collecte / centre de don."""
from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CollectionPoint(Base):
    """Lieu où un donneur peut se présenter pour donner son sang."""

    __tablename__ = "collection_points"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(200), nullable=False)
    localisation: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    hospital_id: Mapped[int | None] = mapped_column(ForeignKey("hospitals.id"), nullable=True)
    horaires: Mapped[str] = mapped_column(String(200), nullable=False, default="Lun-Ven 08h-16h")
