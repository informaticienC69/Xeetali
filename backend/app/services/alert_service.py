"""Logique métier UC-17 — alertes donneurs (mock SMS/Push).

Confidentialité stricte : aucun envoi réel, aucun numéro en clair renvoyé ni
journalisé (masquage ``77****89``). Ciblage par compatibilité ABO/Rh + localité.
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.constants import compatible_donor_groups
from app.models.alert import Alert, AlertResponse
from app.models.donor_profile import DonorProfile
from app.schemas.alert import (
    AlertCreate,
    AlertDispatchResult,
    AlertRespondResult,
)
from app.schemas.enums import AlertScope, AlertStatus, BloodGroup
from app.services.donor_service import get_profile
from app.services.exceptions import NotFoundError

logger = logging.getLogger("xeetali.alert")


async def _mask_number(number: str) -> str:
    """Masque un numéro : 2 chiffres de tête, 2 de fin (``77****89``)."""
    digits = "".join(ch for ch in number if ch.isdigit())
    if len(digits) <= 4:
        return "*" * len(digits)
    return f"{digits[:2]}{'*' * (len(digits) - 4)}{digits[-2:]}"


async def _select_target_donors(
    db: AsyncSession, receiver: BloodGroup, localisation: str | None
) -> list[DonorProfile]:
    """Donneurs compatibles (matrice ABO/Rh) et, si fournie, de la même localité."""
    compatibles = [g.value for g in compatible_donor_groups(receiver)]
    stmt = select(DonorProfile).where(DonorProfile.groupe_sanguin.in_(compatibles))
    if localisation is not None:
        stmt = stmt.where(DonorProfile.localisation == localisation)
    return list((await db.scalars(stmt)).all())


async def dispatch_alert(db: AsyncSession, payload: AlertCreate, user_id: int) -> AlertDispatchResult:
    """Crée l'alerte, cible les donneurs compatibles, simule l'envoi (atomique)."""
    receiver = payload.groupe_sanguin
    portee = AlertScope.NATIONALE if payload.localisation is None else AlertScope.LOCALE
    message = payload.message or (
        f"CNTS Xéétali : besoin urgent de sang {receiver.value}. "
        f"Si vous êtes éligible, présentez-vous au centre de don le plus proche. Merci."
    )
    try:
        donors = _select_target_donors(db, receiver, payload.localisation)
        alert = Alert(
            groupe_sanguin=receiver.value,
            message=message,
            canal=payload.canal.value,
            portee=portee.value,
            statut=AlertStatus.ACTIVE.value,
            created_by=user_id,
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
    except Exception:
        await db.rollback()
        raise

    numeros_masques = [_mask_number(d.telephone) for d in donors]
    logger.info(
        "Alerte #%s %s : %d donneur(s) compatibles notifiés %s (aucun envoi réel).",
        alert.id, receiver.value, len(donors), numeros_masques,
    )
    return AlertDispatchResult(
        alert_id=alert.id,
        groupe_sanguin=receiver,
        groupes_donneurs_compatibles=sorted(compatible_donor_groups(receiver), key=lambda g: g.value),
        donneurs_notifies=len(donors),
        numeros_masques=numeros_masques,
        message=message,
        canal=payload.canal,
        portee=portee,
        envoi_reel=False,
    )


async def respond_to_alert(
    db: AsyncSession, alert_id: int, user_id: int, disponible: bool
) -> AlertRespondResult:
    """Enregistre la réponse d'un donneur à une alerte (atomique)."""
    profile = get_profile(db, user_id)
    alert = await db.get(Alert, alert_id)
    if alert is None:
        raise NotFoundError(f"Alerte {alert_id} introuvable.")
    try:
        response = AlertResponse(alert_id=alert_id, donor_id=profile.id, disponible=disponible)
        db.add(response)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    instructions = (
        "Merci ! Présentez-vous au centre de collecte le plus proche muni d'une pièce "
        "d'identité. Un agent CNTS vous contactera pour confirmer le créneau."
        if disponible
        else "Réponse enregistrée. Merci de votre retour, à une prochaine fois."
    )
    return AlertRespondResult(alert_id=alert_id, disponible=disponible, instructions=instructions)


async def list_active_alerts(db: AsyncSession) -> list[Alert]:
    """Alertes actives (pour l'espace donneur)."""
    result = await db.scalars(
        select(Alert)
        .where(Alert.statut == AlertStatus.ACTIVE.value)
        .order_by(Alert.created_at.desc())
    )
    return list(result.all())
