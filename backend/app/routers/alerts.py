"""Route de simulation d'alerte donneurs USSD/SMS (UC-17)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.alert import AlertRequest, AlertResponse
from app.services import alert_service

router = APIRouter(prefix="/api/alerts", tags=["alertes"])


@router.post("/ussd", response_model=AlertResponse)
def send_ussd_alert(payload: AlertRequest, db: Session = Depends(get_db)) -> AlertResponse:
    """Simule une alerte USSD/SMS pour un groupe sanguin (UC-17).

    Ne réalise aucun envoi réel et ne renvoie aucun numéro en clair (masquage).
    """
    return alert_service.build_ussd_alert(db, payload.groupe_sanguin)
