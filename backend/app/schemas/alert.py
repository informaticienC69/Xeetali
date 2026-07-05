"""Schémas des alertes donneurs (UC-17, mock SMS/Push)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import AlertChannel, AlertScope, AlertStatus, BloodGroup


class AlertCreate(BaseModel):
    """Lancement d'une alerte ciblant les donneurs compatibles."""

    groupe_sanguin: BloodGroup
    localisation: str | None = None  # None ⇒ portée nationale
    canal: AlertChannel = AlertChannel.SMS
    message: str | None = None


class AlertRead(BaseModel):
    """Représentation d'une alerte persistée."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    groupe_sanguin: BloodGroup
    message: str
    canal: AlertChannel
    portee: AlertScope
    statut: AlertStatus
    created_at: datetime


class AlertDispatchResult(BaseModel):
    """Résumé structuré du mock d'envoi (aucun envoi réel, numéros masqués)."""

    alert_id: int
    groupe_sanguin: BloodGroup
    groupes_donneurs_compatibles: list[BloodGroup]
    donneurs_notifies: int
    numeros_masques: list[str]
    message: str
    canal: AlertChannel
    portee: AlertScope
    envoi_reel: bool = False


class AlertRespondRequest(BaseModel):
    """Réponse d'un donneur à une alerte."""

    disponible: bool = True


class AlertRespondResult(BaseModel):
    """Accusé de réponse + instructions logistiques."""

    alert_id: int
    disponible: bool
    instructions: str
