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


class UserRole(str, Enum):
    """Rôles applicatifs (contrôle d'accès)."""

    ADMIN_CNTS = "ADMIN_CNTS"
    PERSONNEL_MEDICAL = "PERSONNEL_MEDICAL"
    DONNEUR = "DONNEUR"


class PouchStatus(str, Enum):
    """Cycle de vie d'une poche de sang."""

    DISPONIBLE = "DISPONIBLE"
    RESERVEE = "RESERVEE"
    UTILISEE = "UTILISEE"
    PERIMEE = "PERIMEE"


class TransferStatus(str, Enum):
    """Statut d'un ordre de transfert."""

    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"


class RequestStatus(str, Enum):
    """Statut d'une demande de sang."""

    OUVERTE = "OUVERTE"
    SATISFAITE = "SATISFAITE"
    ANNULEE = "ANNULEE"


class Urgence(str, Enum):
    """Niveau d'urgence d'une demande."""

    NORMALE = "NORMALE"
    URGENTE = "URGENTE"
    CRITIQUE = "CRITIQUE"


class AppointmentStatus(str, Enum):
    """Statut d'un rendez-vous de don."""

    PLANIFIE = "PLANIFIE"
    HONORE = "HONORE"
    ANNULE = "ANNULE"


class AlertStatus(str, Enum):
    """Statut d'une alerte donneurs."""

    ACTIVE = "ACTIVE"
    CLOTUREE = "CLOTUREE"


class AlertChannel(str, Enum):
    """Canal simulé d'une alerte (aucun envoi réel)."""

    SMS = "SMS"
    PUSH = "PUSH"


class AlertScope(str, Enum):
    """Portée d'une alerte."""

    LOCALE = "LOCALE"
    NATIONALE = "NATIONALE"
