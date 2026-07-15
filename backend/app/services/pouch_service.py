"""Logique métier des poches (UC-08, statut, recherche, validité).

La poche est la source de vérité du stock : chaque opération est atomique et
journalisée (audit médical).
"""
from __future__ import annotations

import base64
import io
import logging
from datetime import date, datetime, timezone
from uuid import uuid4

import qrcode
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.schemas.enums import PouchStatus
from app.schemas.pouch import PouchCreate, PouchValidity
from app.services.exceptions import HospitalNotFoundError, NotFoundError

logger = logging.getLogger("xeetali.pouch")


def _generate_uid() -> str:
    """UID lisible et unique pour une poche."""
    return f"XEE-{uuid4().hex[:12].upper()}"


def _qr_data_uri(uid: str) -> str:
    """Génère un QR Code encodant l'UID, en PNG base64 (data-URI)."""
    img = qrcode.make(uid)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


async def register_pouch(db: AsyncSession, payload: PouchCreate) -> BloodPouch:
    """UC-08 : enregistre une poche ``DISPONIBLE`` avec UID + QR (atomique)."""
    if await db.get(Hospital, payload.hospital_id) is None:
        raise HospitalNotFoundError(f"Hôpital {payload.hospital_id} introuvable.")
    try:
        uid = _generate_uid()
        pouch = BloodPouch(
            uid=uid,
            groupe_sanguin=payload.groupe_sanguin.value,
            hospital_id=payload.hospital_id,
            statut=PouchStatus.DISPONIBLE.value,
            date_prelevement=payload.date_prelevement,
            date_peremption=payload.date_peremption,
            qr_code_b64=_qr_data_uri(uid),
        )
        db.add(pouch)
        await db.commit()
        await db.refresh(pouch)
    except Exception:
        await db.rollback()
        raise
    logger.info("Poche %s enregistrée (%s) hôpital %s.", pouch.uid, pouch.groupe_sanguin, pouch.hospital_id)
    return pouch


async def update_status(db: AsyncSession, uid: str, new_status: PouchStatus) -> BloodPouch:
    """Change le statut d'une poche (atomique, journalisé)."""
    result = await db.scalars(
        select(BloodPouch)
        .where(BloodPouch.uid == uid)
        .with_for_update()
    )
    pouch = result.one_or_none()
    if pouch is None:
        raise NotFoundError(f"Poche {uid} introuvable.")
    try:
        ancien = pouch.statut
        pouch.statut = new_status.value
        await db.commit()
        await db.refresh(pouch)
    except Exception:
        await db.rollback()
        raise
    logger.info("Poche %s statut %s -> %s.", uid, ancien, pouch.statut)
    return pouch


async def search_pouches(
    db: AsyncSession,
    groupe_sanguin: str | None = None,
    hospital_id: int | None = None,
    statut: str | None = None,
) -> list[BloodPouch]:
    """Recherche de poches par critères (urgence)."""
    stmt = select(BloodPouch)
    if groupe_sanguin is not None:
        stmt = stmt.where(BloodPouch.groupe_sanguin == groupe_sanguin)
    if hospital_id is not None:
        stmt = stmt.where(BloodPouch.hospital_id == hospital_id)
    if statut is not None:
        stmt = stmt.where(BloodPouch.statut == statut)
    return list((await db.scalars(stmt.order_by(BloodPouch.date_peremption))).all())


async def check_validity(db: AsyncSession, uid: str) -> PouchValidity:
    """Vérifie l'existence en base + péremption d'une poche par UID."""
    pouch = (await db.scalars(select(BloodPouch).where(BloodPouch.uid == uid))).one_or_none()
    if pouch is None:
        return PouchValidity(uid=uid, existe=False, valide=False, motif="UID inconnu en base.")

    perimee = pouch.date_peremption < date.today() or pouch.statut == PouchStatus.PERIMEE.value
    utilisable = pouch.statut == PouchStatus.DISPONIBLE.value and not perimee
    if perimee:
        motif = "Poche périmée."
    elif pouch.statut != PouchStatus.DISPONIBLE.value:
        motif = f"Poche non disponible (statut {pouch.statut})."
    else:
        motif = "Poche valide et disponible."

    return PouchValidity(
        uid=uid,
        existe=True,
        valide=utilisable,
        statut=PouchStatus(pouch.statut),
        perimee=perimee,
        date_peremption=pouch.date_peremption,
        motif=motif,
    )


async def _now() -> datetime:  # pragma: no cover - utilitaire
    return datetime.now(timezone.utc)
