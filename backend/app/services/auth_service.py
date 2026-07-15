"""Logique métier d'authentification (inscription, connexion)."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.enums import UserRole
from app.services.exceptions import ConflictError, UnauthorizedError


def _token_for(user: User) -> TokenResponse:
    token = create_access_token(subject=user.email, role=user.role)
    return TokenResponse(
        access_token=token,
        role=user.role,
        nom=user.nom,
        user_id=user.id,
        hospital_id=user.hospital_id,
    )


async def register(db: AsyncSession, payload: RegisterRequest) -> TokenResponse:
    """Auto-inscription publique — crée un compte ``DONNEUR`` (email unique) et renvoie un jeton.

    Les rôles ``PERSONNEL_MEDICAL``/``ADMIN_CNTS`` ne sont jamais assignables ici :
    provisionnement exclusif par un administrateur via ``/api/admin/users``.
    """
    try:
        if await db.scalar(select(User).where(User.email == payload.email)) is not None:
            raise ConflictError("Un compte existe déjà avec cet email.")

        user = User(
            nom=payload.nom,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=UserRole.DONNEUR.value,
            hospital_id=None,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    except Exception:
        await db.rollback()
        raise
    return _token_for(user)


async def login(db: AsyncSession, payload: LoginRequest) -> TokenResponse:
    """Vérifie les identifiants et renvoie un jeton, ou lève 401."""
    user = await db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("Email ou mot de passe incorrect.")
    return _token_for(user)
