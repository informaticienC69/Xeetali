"""Rétro-compatibilité : la configuration vit désormais dans ``app.core.config``."""
from app.core.config import Settings, settings

__all__ = ["Settings", "settings"]
