"""Schémas utilisateur (administration des comptes)."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.enums import UserRole


class UserRead(BaseModel):
    """Représentation publique d'un utilisateur (sans hash de mot de passe)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nom: str
    email: EmailStr
    role: UserRole
    hospital_id: int | None = None


class UserCreate(BaseModel):
    """Création d'un utilisateur par l'administrateur."""

    nom: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    hospital_id: int | None = None


class UserUpdate(BaseModel):
    """Mise à jour partielle d'un utilisateur."""

    nom: str | None = Field(default=None, min_length=1, max_length=200)
    role: UserRole | None = None
    hospital_id: int | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
