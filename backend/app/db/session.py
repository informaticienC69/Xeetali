"""Moteur, fabrique de sessions et dépendance FastAPI ``get_db``."""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

# ``check_same_thread`` est spécifique à SQLite (autorise l'usage multi-thread du
# serveur ASGI). Ignoré silencieusement pour les autres SGBD (ex. PostgreSQL).
_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=_connect_args, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    """Fournit une session par requête, systématiquement fermée à la fin.

    Surchargée dans les tests par une base SQLite en mémoire.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
