"""Base déclarative SQLAlchemy 2.0 commune à tous les modèles."""
from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Classe de base déclarative pour tous les modèles ORM Xéétali."""
