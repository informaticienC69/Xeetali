"""Schémas d'authentification (inscription, connexion, jeton)."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from app.schemas.enums import UserRole


class RegisterRequest(BaseModel):
    """Inscription publique d'un donneur.

    Aucun champ ``role`` : l'auto-inscription publique ne peut créer que des
    comptes ``DONNEUR``. Les comptes ``PERSONNEL_MEDICAL``/``ADMIN_CNTS`` sont
    exclusivement provisionnés par un administrateur via ``/api/admin/users``
    (cf. CLAUDE.md, RBAC via ``core/deps.require_role``).
    """

    nom: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


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
