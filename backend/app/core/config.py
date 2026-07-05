"""Configuration applicative via variables d'environnement (aucun secret en dur)."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Paramètres du Node Central Xéétali.

    Chargés depuis l'environnement / fichier `.env`. Base SQLite par défaut
    (portabilité MVP), bascule PostgreSQL via ``DATABASE_URL`` sans autre code.
    Le secret JWT provient de l'environnement — jamais committé.
    """

    app_name: str = "Xeetali Node Central"
    database_url: str = "sqlite:///./xeetali.db"

    # Sécurité JWT (surcharger JWT_SECRET en production via l'environnement).
    jwt_secret: str = "dev-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480  # 8 h

    # Origines autorisées pour le dashboard (dev Vite par défaut).
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
