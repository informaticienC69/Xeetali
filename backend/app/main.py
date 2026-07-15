"""Point d'entrée FastAPI du Node Central Xéétali."""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

# Importe le paquet ``models`` pour enregistrer toutes les tables sur Base.metadata.
import app.models  # noqa: F401
from app.routers import (
    admin,
    alerts,
    appointments,
    auth,
    collection_points,
    configuration,
    donors,
    inventory,
    pouches,
    requests,
    transfers,
)
from app.services.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ServiceError,
    UnauthorizedError,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("xeetali")


app = FastAPI(
    title=settings.app_name,
    description="Node Central — stocks de sang (poche = source de vérité), transferts "
    "(UC-04), donneurs & alertes (UC-14/17/18), administration. CNTS, Sénégal.",
    version="0.2.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (
    auth.router,
    inventory.router,
    pouches.router,
    transfers.router,
    requests.router,
    collection_points.router,
    donors.router,
    appointments.router,
    alerts.router,
    configuration.router,
    admin.router,
):
    app.include_router(r)


# --------------------------------------------------------------------------- #
# Traduction des erreurs métier en réponses HTTP propres (aucun détail interne)
# --------------------------------------------------------------------------- #
def _json(status_code: int, detail: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": detail})


@app.exception_handler(UnauthorizedError)
async def _unauthorized(_: Request, exc: UnauthorizedError) -> JSONResponse:
    return _json(status.HTTP_401_UNAUTHORIZED, str(exc))


@app.exception_handler(ForbiddenError)
async def _forbidden(_: Request, exc: ForbiddenError) -> JSONResponse:
    return _json(status.HTTP_403_FORBIDDEN, str(exc))


@app.exception_handler(NotFoundError)
async def _not_found(_: Request, exc: NotFoundError) -> JSONResponse:
    return _json(status.HTTP_404_NOT_FOUND, str(exc))


@app.exception_handler(ConflictError)
async def _conflict(_: Request, exc: ConflictError) -> JSONResponse:
    return _json(status.HTTP_409_CONFLICT, str(exc))


@app.exception_handler(ServiceError)
async def _service_error(_: Request, exc: ServiceError) -> JSONResponse:
    return _json(status.HTTP_400_BAD_REQUEST, str(exc))


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
    """Filet de sécurité : ne divulgue ni stack trace ni détail interne."""
    logger.exception("Erreur non gérée sur %s %s", request.method, request.url.path)
    return _json(status.HTTP_500_INTERNAL_SERVER_ERROR, "Erreur interne du serveur.")


@app.get("/health", tags=["système"])
def health() -> dict[str, str]:
    """Sonde de disponibilité."""
    return {"status": "ok", "service": settings.app_name}
