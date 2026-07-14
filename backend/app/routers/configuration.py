"""Router pour la gestion de la configuration système."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.configuration import Configuration, ConfigurationCreate, ConfigurationUpdate, PublicConfig
from app.schemas.enums import UserRole
from app.services.configuration_service import (
    create_config,
    delete_config,
    get_config,
    get_public_config,
    list_configs,
    seed_default_configs,
    update_config,
)
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/config", tags=["configuration"])


@router.get("/public", response_model=PublicConfig)
async def get_public_configuration(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PublicConfig:
    """Récupère la configuration publique accessible aux utilisateurs authentifiés."""
    return await get_public_config(db)


@router.get("", response_model=list[Configuration])
async def list_configuration(
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_CNTS)),
) -> list[Configuration]:
    """Liste toutes les configurations (admin uniquement)."""
    return await list_configs(db, category=category)


@router.get("/{key}", response_model=Configuration)
async def get_configuration(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_CNTS)),
) -> Configuration:
    """Récupère une configuration par sa clé (admin uniquement)."""
    config = await get_config(db, key)
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration '{key}' non trouvée",
        )
    return config


@router.post("", response_model=Configuration, status_code=status.HTTP_201_CREATED)
async def create_configuration(
    payload: ConfigurationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_CNTS)),
) -> Configuration:
    """Crée une nouvelle configuration (admin uniquement)."""
    existing = await get_config(db, payload.key)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Configuration '{payload.key}' existe déjà",
        )
    return await create_config(db, payload)


@router.put("/{key}", response_model=Configuration)
async def update_configuration(
    key: str,
    payload: ConfigurationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_CNTS)),
) -> Configuration:
    """Met à jour une configuration (admin uniquement)."""
    config = await update_config(db, key, payload)
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration '{key}' non trouvée",
        )
    return config


@router.delete("/{key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_configuration(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_CNTS)),
) -> None:
    """Supprime une configuration (admin uniquement)."""
    deleted = await delete_config(db, key)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration '{key}' non trouvée",
        )


@router.post("/seed-defaults", status_code=status.HTTP_201_CREATED)
async def seed_configuration_defaults(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_CNTS)),
) -> dict[str, str]:
    """Initialise les configurations par défaut (admin uniquement)."""
    await seed_default_configs(db)
    await db.commit()
    return {"message": "Configurations par défaut initialisées"}
