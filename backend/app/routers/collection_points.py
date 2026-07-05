"""Routes des points de collecte (UC-15)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.collection_point import CollectionPoint
from app.models.user import User
from app.schemas.collection_point import CollectionPointRead

router = APIRouter(prefix="/api/collection-points", tags=["points-collecte"])


@router.get("", response_model=list[CollectionPointRead])
def list_collection_points(
    localisation: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[CollectionPointRead]:
    """Liste les points de collecte, filtrable par localité (UC-15)."""
    stmt = select(CollectionPoint).order_by(CollectionPoint.nom)
    if localisation is not None:
        stmt = stmt.where(CollectionPoint.localisation == localisation)
    return [CollectionPointRead.model_validate(cp) for cp in db.scalars(stmt).all()]
