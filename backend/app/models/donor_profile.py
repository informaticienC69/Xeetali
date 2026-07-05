"""Modèle DonorProfile — profil donneur rattaché à un utilisateur."""
from __future__ import annotations

from datetime import date

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DonorProfile(Base):
    """Informations de don d'un utilisateur de rôle ``DONNEUR``."""

    __tablename__ = "donor_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True, nullable=False
    )
    groupe_sanguin: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    telephone: Mapped[str] = mapped_column(String(20), nullable=False)
    localisation: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    date_dernier_don: Mapped[date | None] = mapped_column(nullable=True)
