"""Modèle de configuration système pour les paramètres ajustables."""
from __future__ import annotations

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Configuration(Base):
    """Configuration système clé-valeur avec métadonnées."""
    __tablename__ = "configurations"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[dict | str | int | float | bool] = mapped_column(JSON, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "stock", "gamification", "system"
