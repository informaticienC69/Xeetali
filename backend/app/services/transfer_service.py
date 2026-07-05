"""Logique métier UC-04 — transfert atomique de poches entre deux hôpitaux.

Règle d'or : toute l'opération (validation → décrément source → incrément/création
cible → création de l'ordre) s'exécute dans **une seule transaction**. Toute erreur
provoque un ``rollback`` complet — aucune modification partielle ne persiste jamais.
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.hospital import Hospital
from app.models.inventory import BloodInventory
from app.models.transfer import TransferOrder
from app.schemas.enums import TransferStatus
from app.schemas.transfer import TransferCreate
from app.services.exceptions import HospitalNotFoundError, InsufficientStockError

logger = logging.getLogger("xeetali.transfer")


def _get_hospital(db: Session, hospital_id: int) -> Hospital:
    hospital = db.get(Hospital, hospital_id)
    if hospital is None:
        raise HospitalNotFoundError(f"Hôpital {hospital_id} introuvable.")
    return hospital


def _get_stock_line(db: Session, hospital_id: int, groupe: str) -> BloodInventory | None:
    return db.scalars(
        select(BloodInventory).where(
            BloodInventory.hospital_id == hospital_id,
            BloodInventory.groupe_sanguin == groupe,
        )
    ).one_or_none()


def execute_transfer(db: Session, payload: TransferCreate) -> TransferOrder:
    """Exécute un transfert UC-04 de façon atomique et journalisée.

    Étapes (toutes dans la même transaction) :
      1. Vérifier l'existence des hôpitaux source et cible (sinon 404).
      2. Contrôler le stock source pour le groupe demandé (sinon 409, aucun ordre).
      3. Décrémenter la source, incrémenter/créer la ligne cible.
      4. Créer l'ordre ``COMPLETED`` (trace d'audit horodatée).
      5. ``commit`` unique. Toute exception → ``rollback`` complet.
    """
    groupe = payload.groupe_sanguin.value
    try:
        # 1. Existence des deux hôpitaux (source ≠ cible déjà garanti par le schéma).
        _get_hospital(db, payload.source_hospital_id)
        _get_hospital(db, payload.target_hospital_id)

        # 2. Contrôle du stock source.
        source_line = _get_stock_line(db, payload.source_hospital_id, groupe)
        if source_line is None or source_line.quantite < payload.quantite:
            disponible = source_line.quantite if source_line else 0
            raise InsufficientStockError(
                f"Stock insuffisant à la source pour {groupe} "
                f"(demandé {payload.quantite}, disponible {disponible})."
            )

        # 3. Décrément source + incrément/création cible.
        source_line.quantite -= payload.quantite

        target_line = _get_stock_line(db, payload.target_hospital_id, groupe)
        if target_line is None:
            target_line = BloodInventory(
                hospital_id=payload.target_hospital_id,
                groupe_sanguin=groupe,
                quantite=payload.quantite,
            )
            db.add(target_line)
        else:
            target_line.quantite += payload.quantite

        # 4. Ordre COMPLETED (audit).
        order = TransferOrder(
            source_hospital_id=payload.source_hospital_id,
            target_hospital_id=payload.target_hospital_id,
            groupe_sanguin=groupe,
            quantite=payload.quantite,
            statut=TransferStatus.COMPLETED.value,
        )
        db.add(order)

        # 5. Validation atomique.
        db.commit()
        db.refresh(order)
    except Exception:
        db.rollback()
        raise

    logger.info(
        "Transfert %s COMPLETED: %s poches %s de l'hôpital %s vers %s (ordre #%s).",
        order.id, order.quantite, order.groupe_sanguin,
        order.source_hospital_id, order.target_hospital_id, order.id,
    )
    return order
