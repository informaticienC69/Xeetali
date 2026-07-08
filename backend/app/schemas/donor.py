"""Schémas du profil donneur (UC-14)."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import BloodGroup


class DonorProfileUpsert(BaseModel):
    """Création / mise à jour du profil donneur de l'utilisateur courant."""

    groupe_sanguin: BloodGroup
    telephone: str = Field(min_length=6, max_length=20)
    localisation: str = Field(min_length=1, max_length=200)
    date_dernier_don: date | None = None


class DonorProfileRead(BaseModel):
    """Représentation du profil donneur."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    groupe_sanguin: BloodGroup
    telephone: str
    localisation: str
    date_dernier_don: date | None


class BadgeStatus(BaseModel):
    """État d'un badge pour un donneur."""

    code: str
    label: str
    description: str
    seuil: int
    obtenu: bool


class DonorStats(BaseModel):
    """Statistiques gamifiées du donneur (100 % dérivées de la base)."""

    nb_dons: int
    total_volume_ml: int
    vies_potentielles: int
    points: int
    niveau: str
    niveau_index: int
    progression: float
    dons_avant_niveau_suivant: int
    rang: int
    nb_donneurs: int
    dernier_don: date | None
    prochain_don_eligible: date | None
    eligible_maintenant: bool
    jours_avant_eligibilite: int
    nb_reponses_alertes: int
    badges: list[BadgeStatus]
    streak_annees: int


class UrgencyStats(BaseModel):
    """Statistiques d'urgence nationale (vies en attente, capacité restante)."""

    vies_en_attente: int
    capacite_pct: int
    groupe_critique: str
    regions: str


class LeaderboardEntry(BaseModel):
    """Une ligne du classement des donneurs (nom abrégé pour la confidentialité)."""

    rang: int
    nom_affiche: str
    groupe_sanguin: BloodGroup
    nb_dons: int
    points: int
    is_me: bool
