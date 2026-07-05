"""Route de consultation des stocks (regroupés par hôpital)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.hospital import Hospital
from app.schemas.enums import BloodGroup
from app.schemas.inventory import InventoryByHospital, StockLine

router = APIRouter(prefix="/api/inventory", tags=["inventaire"])


@router.get("", response_model=list[InventoryByHospital])
def list_inventory(db: Session = Depends(get_db)) -> list[InventoryByHospital]:
    """Retourne l'état des stocks de tous les hôpitaux, agrégé par groupe sanguin."""
    hospitals = db.scalars(
        select(Hospital).options(selectinload(Hospital.inventories)).order_by(Hospital.id)
    ).all()

    result: list[InventoryByHospital] = []
    for hospital in hospitals:
        stocks = [
            StockLine(groupe_sanguin=BloodGroup(inv.groupe_sanguin), quantite=inv.quantite)
            for inv in sorted(hospital.inventories, key=lambda i: i.groupe_sanguin)
        ]
        result.append(
            InventoryByHospital(
                hospital_id=hospital.id,
                nom=hospital.nom,
                localisation=hospital.localisation,
                type=hospital.type,
                stocks=stocks,
            )
        )
    return result
