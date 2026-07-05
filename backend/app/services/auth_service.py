"""Logique métier d'authentification (inscription, connexion)."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.hospital import Hospital
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.exceptions import ConflictError, HospitalNotFoundError, UnauthorizedError


def _token_for(user: User) -> TokenResponse:
    token = create_access_token(subject=user.email, role=user.role)
    return TokenResponse(
        access_token=token,
        role=user.role,
        nom=user.nom,
        user_id=user.id,
        hospital_id=user.hospital_id,
    )


def register(db: Session, payload: RegisterRequest) -> TokenResponse:
    """Crée un utilisateur (email unique) et renvoie un jeton."""
    try:
        if db.query(User).filter(User.email == payload.email).one_or_none() is not None:
            raise ConflictError("Un compte existe déjà avec cet email.")
        if payload.hospital_id is not None and db.get(Hospital, payload.hospital_id) is None:
            raise HospitalNotFoundError(f"Hôpital {payload.hospital_id} introuvable.")

        user = User(
            nom=payload.nom,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=payload.role.value,
            hospital_id=payload.hospital_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise
    return _token_for(user)


def login(db: Session, payload: LoginRequest) -> TokenResponse:
    """Vérifie les identifiants et renvoie un jeton, ou lève 401."""
    user = db.query(User).filter(User.email == payload.email).one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("Email ou mot de passe incorrect.")
    return _token_for(user)
