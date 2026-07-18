"""Configuration applicative via variables d'environnement (aucun secret en dur)."""
from __future__ import annotations

from pydantic import field_validator
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
    # En production, surcharger CORS_ORIGINS avec l'URL Vercel.
    # Accepte une chaîne virgule-séparée OU un tableau JSON :
    #   CORS_ORIGINS=https://xeetali.vercel.app,http://localhost:5173
    #   CORS_ORIGINS=["https://xeetali.vercel.app","http://localhost:5173"]
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> object:
        """Accepte une chaîne virgule-séparée en plus du format JSON/liste."""
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
