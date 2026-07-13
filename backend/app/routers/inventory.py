"""Route de consultation des stocks (comptage en direct des poches DISPONIBLE)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.inventory import InventoryByHospital
from app.services import inventory_service

router = APIRouter(prefix="/api/inventory", tags=["inventaire"])


@router.get("", response_model=list[InventoryByHospital])
async def list_inventory(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
) -> list[InventoryByHospital]:
    """État des stocks de tous les hôpitaux, agrégé en direct par groupe."""
    return await inventory_service.inventory_by_hospital(db, skip=skip, limit=limit)
