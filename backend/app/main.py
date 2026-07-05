"""Point d'entrée FastAPI du Node Central Xéétali."""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.db.base import Base
from app.db.session import engine

# Importe le paquet ``models`` pour enregistrer toutes les tables sur Base.metadata.
import app.models  # noqa: F401  (effet de bord : enregistrement des modèles)
from app.routers import alerts, inventory, transfers

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("xeetali")

# Création des tables (MVP SQLite ; migrations Alembic hors périmètre).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="Node Central — visibilité des stocks de sang, transferts (UC-04), "
    "alertes donneurs simulées (UC-17). Contexte CNTS, Sénégal.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inventory.router)
app.include_router(transfers.router)
app.include_router(alerts.router)


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Filet de sécurité : ne divulgue ni stack trace ni détail interne au client."""
    logger.exception("Erreur non gérée sur %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Erreur interne du serveur."},
    )


@app.get("/health", tags=["système"])
def health() -> dict[str, str]:
    """Sonde de disponibilité."""
    return {"status": "ok", "service": settings.app_name}
