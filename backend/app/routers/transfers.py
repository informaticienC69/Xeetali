"""Route de transfert inter-hôpitaux (UC-04)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.transfer import TransferCreate, TransferRead
from app.services import transfer_service
from app.services.exceptions import HospitalNotFoundError, InsufficientStockError

router = APIRouter(prefix="/api/transfers", tags=["transferts"])


@router.post("", response_model=TransferRead, status_code=status.HTTP_201_CREATED)
def create_transfer(payload: TransferCreate, db: Session = Depends(get_db)) -> TransferRead:
    """Initie un transfert atomique (UC-04).

    - Entrée invalide (groupe, quantité ≤ 0, source = cible) → 422 (Pydantic).
    - Hôpital source ou cible inexistant → 404.
    - Stock source insuffisant → 409, **aucun ordre créé**.
    - Succès → 201 avec l'ordre ``COMPLETED``.
    """
    try:
        order = transfer_service.execute_transfer(db, payload)
    except HospitalNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InsufficientStockError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return TransferRead.model_validate(order)
