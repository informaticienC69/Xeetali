"""Modèle Hôpital."""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.inventory import BloodInventory


class Hospital(Base):
    """Établissement de santé participant au réseau (hôpital, CHR, centre CNTS)."""

    __tablename__ = "hospitals"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(200), nullable=False)
    localisation: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)

    inventories: Mapped[list["BloodInventory"]] = relationship(
        back_populates="hospital", cascade="all, delete-orphan"
    )
