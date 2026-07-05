"""Exceptions métier de la couche services.

Elles portent une intention (404 / 409) sans exposer de détail interne. Les routers
les traduisent en réponses HTTP propres (aucune stack trace renvoyée au client).
"""
from __future__ import annotations


class ServiceError(Exception):
    """Erreur métier de base."""


class HospitalNotFoundError(ServiceError):
    """Un hôpital référencé (source ou cible) n'existe pas → 404."""


class InsufficientStockError(ServiceError):
    """Stock source insuffisant pour honorer le transfert → 409, aucun ordre créé."""
