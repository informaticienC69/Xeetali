"""Peuple la base avec un jeu de données de démonstration (hôpitaux + stocks).

Idempotent : réexécutable sans dupliquer (réinitialise les tables métier concernées).

Usage :
    python seed.py
"""
from __future__ import annotations

from app.db.base import Base
from app.db.session import SessionLocal, engine
import app.models  # noqa: F401  (enregistre les modèles sur Base.metadata)
from app.models.hospital import Hospital
from app.models.inventory import BloodInventory
from app.models.transfer import TransferOrder
from app.schemas.enums import BloodGroup

# (nom, localisation, type, {groupe: quantité})
HOSPITALS: list[tuple[str, str, str, dict[BloodGroup, int]]] = [
    (
        "CNTS Dakar", "Dakar", "Centre National",
        {
            BloodGroup.O_NEG: 40, BloodGroup.O_POS: 120, BloodGroup.A_POS: 90,
            BloodGroup.A_NEG: 20, BloodGroup.B_POS: 55, BloodGroup.B_NEG: 12,
            BloodGroup.AB_POS: 18, BloodGroup.AB_NEG: 5,
        },
    ),
    (
        "Hôpital Principal de Dakar", "Dakar", "Hôpital",
        {
            BloodGroup.O_POS: 30, BloodGroup.O_NEG: 8, BloodGroup.A_POS: 25,
            BloodGroup.B_POS: 15, BloodGroup.AB_POS: 4,
        },
    ),
    (
        "Hôpital Aristide Le Dantec", "Dakar", "Hôpital",
        {
            BloodGroup.O_POS: 18, BloodGroup.A_POS: 12, BloodGroup.A_NEG: 3,
            BloodGroup.B_NEG: 2, BloodGroup.O_NEG: 4,
        },
    ),
    (
        "CHR de Thiès", "Thiès", "CHR",
        {
            BloodGroup.O_POS: 22, BloodGroup.A_POS: 14, BloodGroup.B_POS: 9,
            BloodGroup.O_NEG: 3,
        },
    ),
    (
        "CHR de Saint-Louis", "Saint-Louis", "CHR",
        {
            BloodGroup.O_POS: 16, BloodGroup.A_POS: 10, BloodGroup.B_POS: 6,
            BloodGroup.AB_POS: 2, BloodGroup.O_NEG: 2,
        },
    ),
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        # Réinitialisation idempotente des tables métier.
        session.query(TransferOrder).delete()
        session.query(BloodInventory).delete()
        session.query(Hospital).delete()
        session.commit()

        for nom, localisation, type_, stocks in HOSPITALS:
            hospital = Hospital(nom=nom, localisation=localisation, type=type_)
            session.add(hospital)
            session.flush()  # obtient hospital.id
            for groupe, quantite in stocks.items():
                session.add(
                    BloodInventory(
                        hospital_id=hospital.id,
                        groupe_sanguin=groupe.value,
                        quantite=quantite,
                    )
                )
        session.commit()
        print(f"Seed terminé : {len(HOSPITALS)} hôpitaux et leurs stocks initiaux créés.")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
