"""Énumérations métier partagées (modèles, schémas, services)."""
from __future__ import annotations

from enum import Enum


class BloodGroup(str, Enum):
    """Groupes sanguins autorisés (système ABO + Rhésus)."""

    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class TransferStatus(str, Enum):
    """Statut du cycle de vie d'un ordre de transfert."""

    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
