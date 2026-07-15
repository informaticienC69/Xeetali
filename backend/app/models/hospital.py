"""Modèle Hôpital / établissement de santé."""
from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.region import Region


class Hospital(Base):
    """Établissement participant au réseau (hôpital, CHR, centre CNTS)."""

    __tablename__ = "hospitals"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(200), nullable=False)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(100), nullable=False)

    # ``selectin`` : stratégie de chargement compatible async sans jointure
    # explicite à chaque requête (cf. app/services/inventory_service.py).
    region: Mapped[Region] = relationship(lazy="selectin")
