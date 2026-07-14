"""Routes des points de collecte (UC-15)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.collection_point import CollectionPoint
from app.models.user import User
from app.schemas.collection_point import CollectionPointRead

router = APIRouter(prefix="/api/collection-points", tags=["points-collecte"])


@router.get("", response_model=list[CollectionPointRead])
async def list_collection_points(
    localisation: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[CollectionPointRead]:
    """Liste les points de collecte, filtrable par localité (UC-15)."""
    stmt = select(CollectionPoint).order_by(CollectionPoint.nom)
    if localisation is not None:
        stmt = stmt.where(CollectionPoint.localisation == localisation)
    return [CollectionPointRead.model_validate(cp) for cp in (await db.scalars(stmt)).all()]
