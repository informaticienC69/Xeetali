"""Exceptions métier de la couche services.

Elles portent une intention HTTP (401/403/404/409) sans exposer de détail interne.
Les routers les traduisent en réponses propres (aucune stack trace renvoyée).
"""
from __future__ import annotations


class ServiceError(Exception):
    """Erreur métier de base."""


class NotFoundError(ServiceError):
    """Ressource inexistante → 404."""


class HospitalNotFoundError(NotFoundError):
    """Un hôpital référencé n'existe pas → 404."""


class RegionNotFoundError(NotFoundError):
    """Une région référencée n'existe pas → 404."""


class ConflictError(ServiceError):
    """Conflit d'état (ex. email déjà pris, UID en double) → 409."""


class InsufficientStockError(ConflictError):
    """Stock source insuffisant pour honorer le transfert → 409, aucun ordre."""


class UnauthorizedError(ServiceError):
    """Identifiants invalides → 401."""


class ForbiddenError(ServiceError):
    """Action interdite pour le rôle/propriétaire → 403."""
