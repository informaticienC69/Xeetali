"""Routes d'authentification."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services import auth_service
from app.core.limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Crée un compte et renvoie un jeton d'accès."""
    return await auth_service.register(db, payload)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Authentifie un utilisateur et renvoie un jeton d'accès."""
    return await auth_service.login(db, payload)
