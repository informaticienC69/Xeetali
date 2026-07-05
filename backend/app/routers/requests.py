"""Routes des demandes de sang."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.enums import UserRole
from app.schemas.request import RequestCreate, RequestRead
from app.services import request_service

router = APIRouter(prefix="/api/requests", tags=["demandes"])


@router.post("", response_model=RequestRead, status_code=status.HTTP_201_CREATED)
def create_request(
    payload: RequestCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role(UserRole.PERSONNEL_MEDICAL, UserRole.ADMIN_CNTS)),
) -> RequestRead:
    """Émet une demande de sang."""
    return RequestRead.model_validate(request_service.create_request(db, payload, current.id))


@router.get("", response_model=list[RequestRead])
def list_requests(
    db: Session = Depends(get_db), _: User = Depends(get_current_user)
) -> list[RequestRead]:
    """Liste les demandes de sang."""
    return [RequestRead.model_validate(r) for r in request_service.list_requests(db)]
