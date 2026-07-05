"""Logique métier des demandes de sang."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.hospital import Hospital
from app.models.request import BloodRequest
from app.schemas.request import RequestCreate
from app.services.exceptions import HospitalNotFoundError


def create_request(db: Session, payload: RequestCreate, user_id: int) -> BloodRequest:
    """Émet une demande de sang (atomique)."""
    if db.get(Hospital, payload.hospital_id) is None:
        raise HospitalNotFoundError(f"Hôpital {payload.hospital_id} introuvable.")
    try:
        req = BloodRequest(
            hospital_id=payload.hospital_id,
            groupe_sanguin=payload.groupe_sanguin.value,
            quantite=payload.quantite,
            urgence=payload.urgence.value,
            created_by=user_id,
        )
        db.add(req)
        db.commit()
        db.refresh(req)
    except Exception:
        db.rollback()
        raise
    return req


def list_requests(db: Session) -> list[BloodRequest]:
    """Liste les demandes, plus récentes d'abord."""
    return list(db.scalars(select(BloodRequest).order_by(BloodRequest.created_at.desc())).all())
