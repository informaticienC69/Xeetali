"""Configuration applicative via variables d'environnement (aucun secret en dur)."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Paramètres du Node Central Xéétali.

    Chargés depuis l'environnement / fichier `.env`. La base est SQLite par défaut
    (portabilité MVP) mais bascule vers PostgreSQL en changeant simplement
    ``DATABASE_URL`` — aucune autre modification de code n'est requise.
    """

    app_name: str = "Xeetali Node Central"
    database_url: str = "sqlite:///./xeetali.db"
    # Origines autorisées pour le dashboard (dev Vite par défaut).
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
