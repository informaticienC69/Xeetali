"""Schémas de requête/réponse pour les transferts (UC-04)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, PositiveInt, model_validator

from app.schemas.enums import BloodGroup, TransferStatus


class TransferCreate(BaseModel):
    """Requête d'ordre de transfert.

    Validations statiques (avant toute logique métier) :
    - ``groupe_sanguin`` restreint à l'enum ``BloodGroup`` ;
    - ``quantite`` entier strictement positif (``PositiveInt``) ;
    - hôpital source différent de la cible.
    """

    source_hospital_id: int
    target_hospital_id: int
    groupe_sanguin: BloodGroup
    quantite: PositiveInt

    @model_validator(mode="after")
    def _source_differs_from_target(self) -> "TransferCreate":
        if self.source_hospital_id == self.target_hospital_id:
            raise ValueError("L'hôpital source doit être différent de l'hôpital cible.")
        return self


class TransferRead(BaseModel):
    """Représentation d'un ordre de transfert persisté."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    source_hospital_id: int
    target_hospital_id: int
    groupe_sanguin: BloodGroup
    quantite: int
    statut: TransferStatus
    created_at: datetime
