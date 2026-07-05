"""Schémas d'authentification (inscription, connexion, jeton)."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from app.schemas.enums import UserRole


class RegisterRequest(BaseModel):
    """Inscription d'un utilisateur."""

    nom: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    hospital_id: int | None = None


class LoginRequest(BaseModel):
    """Connexion par email + mot de passe."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Jeton d'accès renvoyé après connexion/inscription."""

    access_token: str
    token_type: str = "bearer"
    role: UserRole
    nom: str
    user_id: int
    hospital_id: int | None = None
