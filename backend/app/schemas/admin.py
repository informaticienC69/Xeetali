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
