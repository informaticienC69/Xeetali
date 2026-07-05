"""Schémas des poches de sang (UC-08 et gestion de statut)."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, model_validator

from app.schemas.enums import BloodGroup, PouchStatus


class PouchCreate(BaseModel):
    """Enregistrement d'une nouvelle poche (UID + QR générés côté serveur)."""

    groupe_sanguin: BloodGroup
    hospital_id: int
    date_prelevement: date
    date_peremption: date

    @model_validator(mode="after")
    def _dates_coherentes(self) -> "PouchCreate":
        if self.date_peremption <= self.date_prelevement:
            raise ValueError("La date de péremption doit être postérieure au prélèvement.")
        return self


class PouchStatusUpdate(BaseModel):
    """Changement de statut d'une poche."""

    statut: PouchStatus


class PouchRead(BaseModel):
    """Représentation d'une poche."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    uid: str
    groupe_sanguin: BloodGroup
    hospital_id: int
    statut: PouchStatus
    date_prelevement: date
    date_peremption: date
    qr_code_b64: str
    created_at: datetime


class PouchValidity(BaseModel):
    """Résultat de la vérification de validité d'une poche par UID."""

    uid: str
    existe: bool
    valide: bool
    statut: PouchStatus | None = None
    perimee: bool | None = None
    date_peremption: date | None = None
    motif: str
