"""Schémas Pydantic pour la configuration système."""
from __future__ import annotations

from pydantic import BaseModel, Field


class ConfigurationBase(BaseModel):
    """Base pour les schémas de configuration."""
    key: str = Field(..., max_length=100, description="Clé unique de configuration")
    value: dict | str | int | float | bool = Field(..., description="Valeur de configuration")
    description: str | None = Field(None, max_length=500, description="Description de la configuration")
    category: str | None = Field(None, max_length=50, description="Catégorie (stock, gamification, system)")


class ConfigurationCreate(ConfigurationBase):
    """Schéma pour créer une configuration."""
    pass


class ConfigurationUpdate(BaseModel):
    """Schéma pour mettre à jour une configuration."""
    value: dict | str | int | float | bool = Field(..., description="Nouvelle valeur")
    description: str | None = Field(None, max_length=500, description="Description mise à jour")


class Configuration(ConfigurationBase):
    """Schéma complet de configuration."""
    model_config = {"from_attributes": True}


class PublicConfig(BaseModel):
    """Configuration publique accessible aux utilisateurs authentifiés."""
    ideal_stock: int = Field(default=50, description="Seuil de stock idéal par groupe sanguin")
    low_stock_threshold: int = Field(default=5, description="Seuil de stock faible")
