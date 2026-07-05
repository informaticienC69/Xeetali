"""Route de transfert inter-hôpitaux (UC-04, réservé ADMIN_CNTS)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.enums import UserRole
from app.schemas.transfer import TransferCreate, TransferRead
from app.services import transfer_service

router = APIRouter(prefix="/api/transfers", tags=["transferts"])


@router.post("", response_model=TransferRead, status_code=status.HTTP_201_CREATED)
def create_transfer(
    payload: TransferCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role(UserRole.ADMIN_CNTS)),
) -> TransferRead:
    """Réaffecte N poches source→cible atomiquement.

    409 stock insuffisant (aucune modif) · 422 invalide · 404 hôpital · 403 rôle.
    """
    order = transfer_service.execute_transfer(db, payload, user_id=current.id)
    return TransferRead.model_validate(order)
