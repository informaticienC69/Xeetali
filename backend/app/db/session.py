"""Moteur, fabrique de sessions et dépendance FastAPI ``get_db``."""
from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

url = settings.database_url
if url.startswith("sqlite://"):
    url = url.replace("sqlite://", "sqlite+aiosqlite://")
elif url.startswith("postgresql://"):
    url = url.replace("postgresql://", "postgresql+psycopg://")

engine = create_async_engine(url, connect_args=_connect_args, future=True)

SessionLocal = async_sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Fournit une session asynchrone par requête."""
    async with SessionLocal() as db:
        yield db
