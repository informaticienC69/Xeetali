"""Modèle Région — les 14 régions administratives officielles du Sénégal."""
from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Region(Base):
    """Région administrative (référence géographique pour la carte nationale)."""

    __tablename__ = "regions"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    capitale: Mapped[str] = mapped_column(String(100), nullable=False)
    population: Mapped[int] = mapped_column(nullable=False)
    longitude: Mapped[float] = mapped_column(nullable=False)
    latitude: Mapped[float] = mapped_column(nullable=False)
