"""Routes des alertes donneurs (UC-17, mock SMS/Push)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.alert import (
    AlertCreate,
    AlertDispatchResult,
    AlertRead,
    AlertRespondRequest,
    AlertRespondResult,
)
from app.schemas.enums import UserRole
from app.services import alert_service

router = APIRouter(prefix="/api/alerts", tags=["alertes"])


@router.post("", response_model=AlertDispatchResult, status_code=status.HTTP_201_CREATED)
async def create_alert(
    payload: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role(UserRole.ADMIN_CNTS)),
) -> AlertDispatchResult:
    """UC-17 : cible les donneurs compatibles et simule l'envoi (aucun envoi réel)."""
    return await alert_service.dispatch_alert(db, payload, current.id)


@router.get("", response_model=list[AlertRead])
async def list_active_alerts(
    db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)
) -> list[AlertRead]:
    """Liste les alertes actives (visibles par les donneurs)."""
    return [AlertRead.model_validate(a) for a in await alert_service.list_active_alerts(db)]


@router.post("/{alert_id}/respond", response_model=AlertRespondResult)
async def respond_to_alert(
    alert_id: int,
    payload: AlertRespondRequest,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_role(UserRole.DONNEUR)),
) -> AlertRespondResult:
    """UC-17 (donneur) : déclare sa disponibilité → instructions logistiques."""
    return await alert_service.respond_to_alert(db, alert_id, current.id, payload.disponible)
