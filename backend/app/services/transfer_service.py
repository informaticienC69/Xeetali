"""Logique métier UC-04 — transfert atomique de poches entre deux hôpitaux.

Source de vérité = poche. Transférer N poches = **réaffecter** N poches
``DISPONIBLE`` du groupe demandé de la source vers la cible (sélection FIFO par
péremption). Toute l'opération est une seule transaction ; toute erreur →
``rollback`` complet, aucune réaffectation partielle.
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.models.transfer import TransferOrder
from app.schemas.enums import PouchStatus, TransferStatus
from app.schemas.transfer import TransferCreate
from app.services.exceptions import HospitalNotFoundError, InsufficientStockError

logger = logging.getLogger("xeetali.transfer")


async def _get_hospital(db: AsyncSession, hospital_id: int) -> Hospital:
    hospital = await db.get(Hospital, hospital_id)
    if hospital is None:
        raise HospitalNotFoundError(f"Hôpital {hospital_id} introuvable.")
    return hospital


async def execute_transfer(db: AsyncSession, payload: TransferCreate, user_id: int) -> TransferOrder:
    """Réaffecte N poches source→cible de façon atomique (UC-04).

    Insuffisant → ``InsufficientStockError`` (409) sans aucune modification.
    """
    groupe = payload.groupe_sanguin.value
    try:
        _get_hospital(db, payload.source_hospital_id)
        _get_hospital(db, payload.target_hospital_id)

        # Poches disponibles à la source, FIFO par péremption (plus proche d'abord).
        result = await db.scalars(
            select(BloodPouch)
            .where(
                BloodPouch.hospital_id == payload.source_hospital_id,
                BloodPouch.groupe_sanguin == groupe,
                BloodPouch.statut == PouchStatus.DISPONIBLE.value,
            )
            .with_for_update(skip_locked=True)
            .order_by(BloodPouch.date_peremption)
            .limit(payload.quantite)
        )
        pouches = list(result.all())
        if len(pouches) < payload.quantite:
            raise InsufficientStockError(
                f"Stock insuffisant à la source pour {groupe} "
                f"(demandé {payload.quantite}, disponible {len(pouches)})."
            )

        # Réaffectation : les poches changent d'hôpital.
        for pouch in pouches:
            pouch.hospital_id = payload.target_hospital_id

        order = TransferOrder(
            source_hospital_id=payload.source_hospital_id,
            target_hospital_id=payload.target_hospital_id,
            groupe_sanguin=groupe,
            quantite=payload.quantite,
            statut=TransferStatus.COMPLETED.value,
            created_by=user_id,
        )
        db.add(order)
        await db.commit()
        await db.refresh(order)
    except Exception:
        await db.rollback()
        raise

    logger.info(
        "Transfert #%s COMPLETED: %s poches %s hôpital %s -> %s (par user %s).",
        order.id, order.quantite, groupe,
        order.source_hospital_id, order.target_hospital_id, user_id,
    )
    return order
