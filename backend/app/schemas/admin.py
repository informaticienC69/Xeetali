"""Schémas du tableau de bord administrateur."""
from __future__ import annotations

from pydantic import BaseModel

from app.schemas.enums import BloodGroup


class NationalStockLine(BaseModel):
    """Total national de poches disponibles par groupe sanguin."""

    groupe_sanguin: BloodGroup
    quantite: int


class DashboardStats(BaseModel):
    """Agrégats nationaux pour le tableau de bord CNTS."""

    total_poches_disponibles: int
    stock_national_par_groupe: list[NationalStockLine]
    nb_hopitaux: int
    nb_donneurs: int
    demandes_ouvertes: int
    alertes_actives: int


# --------------------------------------------------------------------------- #
# Analytics (dashboard graphique) — toutes les valeurs sont dérivées de la BD.
# --------------------------------------------------------------------------- #
class LabeledCount(BaseModel):
    """Un couple (libellé, valeur) pour un graphe catégoriel."""

    label: str
    value: int


class TimePoint(BaseModel):
    """Un point d'une série temporelle (date ISO ou libellé de mois)."""

    date: str
    value: int


class AnalyticsResponse(BaseModel):
    """Agrégations complètes pour le dashboard graphique."""

    # Indicateurs clés
    total_poches_disponibles: int
    nb_hopitaux: int
    nb_donneurs: int
    demandes_ouvertes: int
    alertes_actives: int
    poches_expirant_7j: int
    total_transferts: int
    dons_6_mois: int

    # Répartitions catégorielles
    stock_par_groupe: list[LabeledCount]
    poches_par_statut: list[LabeledCount]
    stock_par_hopital: list[LabeledCount]
    donneurs_par_groupe: list[LabeledCount]
    demandes_par_urgence: list[LabeledCount]

    # Séries temporelles
    transferts_par_jour: list[TimePoint]
    dons_par_mois: list[TimePoint]


# --------------------------------------------------------------------------- #
# Stock par région (carte nationale) — 100 % dérivé de la BD.
# --------------------------------------------------------------------------- #
class RegionBloodGroupStock(BaseModel):
    """Stock disponible pour un groupe sanguin dans une région, vs. cible idéale."""

    groupe_sanguin: BloodGroup
    quantite: int
    cible: int


class RegionStock(BaseModel):
    """Agrégat régional du stock (calculé depuis les hôpitaux localisés dans la région)."""

    nom: str
    capitale: str
    population: int
    coords: list[float]
    nb_hopitaux: int
    total_poches: int
    stock_pct: float
    statut: str
    demandes_urgentes: int
    groupes: list[RegionBloodGroupStock]
