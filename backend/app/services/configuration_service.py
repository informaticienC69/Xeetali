"""Service de gestion de la configuration système."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.configuration import Configuration
from app.schemas.configuration import ConfigurationCreate, ConfigurationUpdate, PublicConfig


# Valeurs par défaut pour les configurations
DEFAULT_CONFIGS = {
    "stock.ideal": {
        "value": 50,
        "description": "Seuil de stock idéal par groupe sanguin",
        "category": "stock",
    },
    "stock.low_threshold": {
        "value": 5,
        "description": "Seil de stock faible (alerte)",
        "category": "stock",
    },
    # Alignés sur core/gamification.py::DEFAULT_LEVELS (seule référence des noms de
    # palier) — un écart entre les deux tables change silencieusement le niveau
    # affiché à chaque donneur sans qu'aucune erreur ne se déclenche.
    "gamification.level_1_threshold": {
        "value": 1,
        "description": "Seuil pour le niveau Bronze",
        "category": "gamification",
    },
    "gamification.level_2_threshold": {
        "value": 3,
        "description": "Seuil pour le niveau Argent",
        "category": "gamification",
    },
    "gamification.level_3_threshold": {
        "value": 5,
        "description": "Seuil pour le niveau Or",
        "category": "gamification",
    },
    "gamification.level_4_threshold": {
        "value": 10,
        "description": "Seuil pour le niveau Platine",
        "category": "gamification",
    },
    "gamification.level_5_threshold": {
        "value": 20,
        "description": "Seuil pour le niveau Diamant",
        "category": "gamification",
    },
}


async def get_config(db: AsyncSession, key: str) -> Configuration | None:
    """Récupère une configuration par sa clé."""
    result = await db.execute(select(Configuration).where(Configuration.key == key))
    return result.scalar_one_or_none()


async def get_config_value(db: AsyncSession, key: str, default=None):
    """Récupère la valeur d'une configuration avec fallback sur la valeur par défaut."""
    config = await get_config(db, key)
    if config is None:
        if key in DEFAULT_CONFIGS:
            return DEFAULT_CONFIGS[key]["value"]
        return default
    return config.value


async def list_configs(db: AsyncSession, category: str | None = None) -> list[Configuration]:
    """Liste toutes les configurations, optionnellement filtrées par catégorie."""
    query = select(Configuration)
    if category:
        query = query.where(Configuration.category == category)
    query = query.order_by(Configuration.category, Configuration.key)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_config(db: AsyncSession, payload: ConfigurationCreate) -> Configuration:
    """Crée une nouvelle configuration (atomique)."""
    try:
        config = Configuration(**payload.model_dump())
        db.add(config)
        await db.commit()
        await db.refresh(config)
    except Exception:
        await db.rollback()
        raise
    return config


async def update_config(db: AsyncSession, key: str, payload: ConfigurationUpdate) -> Configuration | None:
    """Met à jour une configuration existante (atomique)."""
    config = await get_config(db, key)
    if config is None:
        return None
    try:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(config, field, value)
        await db.commit()
        await db.refresh(config)
    except Exception:
        await db.rollback()
        raise
    return config


async def delete_config(db: AsyncSession, key: str) -> bool:
    """Supprime une configuration (atomique)."""
    config = await get_config(db, key)
    if config is None:
        return False
    try:
        await db.delete(config)
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return True


async def get_public_config(db: AsyncSession) -> PublicConfig:
    """Récupère la configuration publique pour les utilisateurs authentifiés."""
    ideal_stock = await get_config_value(db, "stock.ideal", 50)
    low_threshold = await get_config_value(db, "stock.low_threshold", 5)
    return PublicConfig(ideal_stock=ideal_stock, low_stock_threshold=low_threshold)


async def seed_default_configs(db: AsyncSession) -> None:
    """Initialise les configurations par défaut si elles n'existent pas."""
    for key, config_data in DEFAULT_CONFIGS.items():
        existing = await get_config(db, key)
        if existing is None:
            config = Configuration(
                key=key,
                value=config_data["value"],
                description=config_data["description"],
                category=config_data["category"],
            )
            db.add(config)
    await db.flush()
