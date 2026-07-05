"""Sécurité : hachage de mots de passe (bcrypt) et jetons JWT.

Les fonctions ``hash_password`` / ``verify_password`` sont volontairement abstraites :
si ``passlib``/``bcrypt`` posait souci sur une plateforme, seul ce module change.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Retourne le hash bcrypt d'un mot de passe en clair."""
    return _pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Vérifie un mot de passe en clair contre son hash."""
    return _pwd_context.verify(plain, hashed)


def create_access_token(subject: str, role: str) -> str:
    """Crée un JWT signé portant l'identité (``sub``) et le rôle."""
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """Décode et valide un JWT. Lève ``jwt.PyJWTError`` si invalide/expiré."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
