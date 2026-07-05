"""Peuple la base avec un jeu de démonstration complet.

Idempotent : réinitialise les tables métier avant réinsertion.

Comptes de démonstration (mot de passe commun : ``Password123!``) :
  - admin@cnts.sn     — ADMIN_CNTS
  - medecin@cnts.sn   — PERSONNEL_MEDICAL (rattaché au CNTS Dakar)
  - donneur@cnts.sn   — DONNEUR (profil O-, Dakar)

Usage : python seed.py
"""
from __future__ import annotations

import random
from datetime import date, datetime, timedelta, timezone

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
import app.models  # noqa: F401
from app.models.appointment import Appointment
from app.models.collection_point import CollectionPoint
from app.models.donation import Donation
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.models.user import User
from app.services.pouch_service import _generate_uid, _qr_data_uri  # réutilise la génération réelle
from app.schemas.enums import (
    AppointmentStatus,
    BloodGroup,
    PouchStatus,
    UserRole,
)

PASSWORD = "Password123!"

HOSPITALS = [
    ("CNTS Dakar", "Dakar", "Centre National"),
    ("Hôpital Principal de Dakar", "Dakar", "Hôpital"),
    ("Hôpital Aristide Le Dantec", "Dakar", "Hôpital"),
    ("CHR de Thiès", "Thiès", "CHR"),
    ("CHR de Saint-Louis", "Saint-Louis", "CHR"),
]

# Stock initial (nb de poches DISPONIBLE) par hôpital et groupe.
STOCKS = {
    "CNTS Dakar": {BloodGroup.O_NEG: 12, BloodGroup.O_POS: 40, BloodGroup.A_POS: 30,
                   BloodGroup.A_NEG: 6, BloodGroup.B_POS: 18, BloodGroup.AB_POS: 5},
    "Hôpital Principal de Dakar": {BloodGroup.O_POS: 15, BloodGroup.A_POS: 10, BloodGroup.B_POS: 6},
    "Hôpital Aristide Le Dantec": {BloodGroup.O_POS: 8, BloodGroup.A_POS: 5, BloodGroup.O_NEG: 2},
    "CHR de Thiès": {BloodGroup.O_POS: 10, BloodGroup.A_POS: 7, BloodGroup.B_POS: 3},
    "CHR de Saint-Louis": {BloodGroup.O_POS: 6, BloodGroup.A_POS: 4, BloodGroup.AB_POS: 1},
}

DONORS = [
    ("Awa Ndiaye", "awa@donneur.sn", BloodGroup.O_NEG, "771111189", "Dakar"),
    ("Modou Fall", "modou@donneur.sn", BloodGroup.O_POS, "772223399", "Dakar"),
    ("Fatou Sarr", "fatou@donneur.sn", BloodGroup.A_POS, "773334477", "Thiès"),
    ("Ibrahima Ba", "ibrahima@donneur.sn", BloodGroup.B_POS, "774445566", "Saint-Louis"),
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Réinitialisation idempotente (ordre respectant les FK).
        for model in (Donation, Appointment, BloodPouch, CollectionPoint,
                      DonorProfile, User, Hospital):
            db.query(model).delete()
        db.commit()

        hospitals: dict[str, Hospital] = {}
        for nom, loc, typ in HOSPITALS:
            h = Hospital(nom=nom, localisation=loc, type=typ)
            db.add(h)
            hospitals[nom] = h
        db.flush()

        cnts = hospitals["CNTS Dakar"]

        # Utilisateurs de démonstration.
        db.add(User(nom="Admin CNTS", email="admin@cnts.sn",
                    password_hash=hash_password(PASSWORD), role=UserRole.ADMIN_CNTS.value))
        db.add(User(nom="Dr Diop", email="medecin@cnts.sn",
                    password_hash=hash_password(PASSWORD),
                    role=UserRole.PERSONNEL_MEDICAL.value, hospital_id=cnts.id))
        demo_donor_user = User(nom="Donneur Démo", email="donneur@cnts.sn",
                               password_hash=hash_password(PASSWORD), role=UserRole.DONNEUR.value)
        db.add(demo_donor_user)
        db.flush()

        # Poches (source de vérité du stock), péremptions échelonnées.
        today = date.today()
        for nom, stocks in STOCKS.items():
            hid = hospitals[nom].id
            for groupe, count in stocks.items():
                for _ in range(count):
                    uid = _generate_uid()
                    db.add(BloodPouch(
                        uid=uid, groupe_sanguin=groupe.value, hospital_id=hid,
                        statut=PouchStatus.DISPONIBLE.value,
                        date_prelevement=today - timedelta(days=random.randint(0, 20)),
                        date_peremption=today + timedelta(days=random.randint(7, 42)),
                        qr_code_b64=_qr_data_uri(uid),
                    ))

        # Points de collecte.
        points = [
            CollectionPoint(nom="Centre CNTS Dakar", localisation="Dakar", hospital_id=cnts.id),
            CollectionPoint(nom="Antenne Thiès", localisation="Thiès",
                            hospital_id=hospitals["CHR de Thiès"].id),
            CollectionPoint(nom="Antenne Saint-Louis", localisation="Saint-Louis",
                            hospital_id=hospitals["CHR de Saint-Louis"].id),
        ]
        db.add_all(points)

        # Donneurs + profil du donneur démo.
        db.add(DonorProfile(user_id=demo_donor_user.id, groupe_sanguin=BloodGroup.O_NEG.value,
                            telephone="770000089", localisation="Dakar"))
        for nom, email, groupe, tel, loc in DONORS:
            u = User(nom=nom, email=email, password_hash=hash_password(PASSWORD),
                     role=UserRole.DONNEUR.value)
            db.add(u)
            db.flush()
            db.add(DonorProfile(user_id=u.id, groupe_sanguin=groupe.value,
                                telephone=tel, localisation=loc))
        db.flush()

        # Un rendez-vous et un don de démonstration pour le donneur démo.
        demo_profile = db.query(DonorProfile).filter(
            DonorProfile.user_id == demo_donor_user.id).one()
        db.add(Appointment(donor_id=demo_profile.id, collection_point_id=points[0].id,
                           date=datetime.now(timezone.utc) + timedelta(days=5),
                           statut=AppointmentStatus.PLANIFIE.value))
        db.add(Donation(donor_id=demo_profile.id, collection_point_id=points[0].id,
                        groupe_sanguin=BloodGroup.O_NEG.value, volume=450,
                        date=today - timedelta(days=90)))

        db.commit()

        nb_pouches = db.query(BloodPouch).count()
        nb_donors = db.query(DonorProfile).count()
        print(f"Seed terminé : {len(HOSPITALS)} hôpitaux, {nb_pouches} poches, "
              f"{nb_donors} donneurs, 3 comptes démo (mdp: {PASSWORD}).")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
