"""Dépendances FastAPI d'authentification et de contrôle d'accès par rôle."""
from __future__ import annotations

from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.enums import UserRole

# tokenUrl sert la doc Swagger (bouton Authorize) ; l'auth réelle est le Bearer JWT.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

_CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authentification requise ou invalide.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """Résout l'utilisateur courant à partir du JWT. Lève 401 si invalide."""
    try:
        payload = decode_access_token(token)
        email = payload.get("sub")
        if not email:
            raise _CREDENTIALS_EXC
    except jwt.PyJWTError:
        raise _CREDENTIALS_EXC

    user = db.query(User).filter(User.email == email).one_or_none()
    if user is None:
        raise _CREDENTIALS_EXC
    return user


def require_role(*roles: UserRole) -> Callable[[User], User]:
    """Fabrique une dépendance exigeant l'un des rôles fournis (sinon 403)."""
    allowed = {r.value for r in roles}

    def _checker(current: User = Depends(get_current_user)) -> User:
        if current.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé : rôle insuffisant.",
            )
        return current

    return _checker
