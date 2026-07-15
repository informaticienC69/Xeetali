"""Agrégation en direct du stock : comptage des poches DISPONIBLE.

Aucune colonne quantité : le stock est toujours dérivé des poches, garantissant
la cohérence (la poche est l'unique source de vérité).
"""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.schemas.enums import BloodGroup, PouchStatus
from app.schemas.inventory import InventoryByHospital, StockLine


async def _available_counts(db: AsyncSession) -> dict[tuple[int, str], int]:
    """Comptage des poches DISPONIBLE par (hospital_id, groupe_sanguin)."""
    rows = (await db.execute(
        select(
            BloodPouch.hospital_id,
            BloodPouch.groupe_sanguin,
            func.count(BloodPouch.id),
        )
        .where(BloodPouch.statut == PouchStatus.DISPONIBLE.value)
        .group_by(BloodPouch.hospital_id, BloodPouch.groupe_sanguin)
    )).all()
    return {(hid, groupe): count for hid, groupe, count in rows}


async def inventory_by_hospital(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[InventoryByHospital]:
    """État des stocks de tous les hôpitaux, une ligne par groupe présent."""
    counts = await _available_counts(db)
    hospitals = (await db.scalars(select(Hospital).order_by(Hospital.id).offset(skip).limit(limit))).all()

    result: list[InventoryByHospital] = []
    for hospital in hospitals:
        stocks = [
            StockLine(groupe_sanguin=BloodGroup(groupe), quantite=counts[(hid, groupe)])
            for (hid, groupe) in sorted(counts.keys())
            if hid == hospital.id
        ]
        result.append(
            InventoryByHospital(
                hospital_id=hospital.id,
                nom=hospital.nom,
                region_nom=hospital.region.nom,
                type=hospital.type,
                stocks=stocks,
            )
        )
    return result


async def available_count(db: AsyncSession, hospital_id: int, groupe_sanguin: str) -> int:
    """Nombre de poches DISPONIBLE pour un (hôpital, groupe)."""
    return int(
        await db.scalar(
            select(func.count(BloodPouch.id)).where(
                BloodPouch.hospital_id == hospital_id,
                BloodPouch.groupe_sanguin == groupe_sanguin,
                BloodPouch.statut == PouchStatus.DISPONIBLE.value,
            )
        )
        or 0
    )
