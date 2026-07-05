"""Schémas de requête/réponse pour le mock d'alerte USSD/SMS (UC-17)."""
from __future__ import annotations

from pydantic import BaseModel

from app.schemas.enums import BloodGroup


class AlertRequest(BaseModel):
    """Requête de simulation d'alerte donneurs pour un groupe sanguin."""

    groupe_sanguin: BloodGroup


class AlertResponse(BaseModel):
    """Résultat structuré de la simulation (aucun envoi réel effectué).

    ``donneurs_notifies`` contient des numéros **masqués** (ex. ``77****89``) ;
    aucun numéro en clair ne transite ni n'est journalisé.
    """

    groupe_sanguin: BloodGroup
    donneurs_notifies: int
    numeros_masques: list[str]
    message: str
    canal: str
    envoi_reel: bool = False
