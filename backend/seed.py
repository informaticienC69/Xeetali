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

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.constants import SENEGAL_REGIONS
from app.core.security import hash_password
from app.db.base import Base
import app.models  # noqa: F401
from app.models.alert import Alert, AlertResponse
from app.models.appointment import Appointment
from app.models.collection_point import CollectionPoint
from app.models.configuration import Configuration
from app.models.donation import Donation
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.models.region import Region
from app.models.request import BloodRequest
from app.models.transfer import TransferOrder
from app.models.user import User
from app.services.pouch_service import _generate_uid, _qr_data_uri  # réutilise la génération réelle
from app.schemas.enums import (
    AppointmentStatus,
    BloodGroup,
    PouchStatus,
    RequestStatus,
    TransferStatus,
    UserRole,
    Urgence,
)

# Moteur synchrone dédié : l'appli sert des requêtes async (app/db/session.py),
# mais ce script est un one-shot exécuté hors requête HTTP (docker-compose
# ``db_setup``) — inutile d'introduire une boucle asyncio pour un seed.
_url = settings.database_url
if _url.startswith("sqlite://"):
    _connect_args = {"check_same_thread": False}
elif _url.startswith("postgresql://"):
    _url = _url.replace("postgresql://", "postgresql+psycopg://", 1)
    _connect_args = {}
else:
    _connect_args = {}

engine = create_engine(_url, connect_args=_connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

PASSWORD = "Password123!"

# Un établissement par région administrative (Dakar en a 3, comme dans la
# réalité du réseau CNTS) — couvre les 14 régions pour que la carte nationale
# ait des données partout plutôt que la plupart en « hors réseau ».
HOSPITALS = [
    ("CNTS Dakar", "Dakar", "Centre National"),
    ("Hôpital Principal de Dakar", "Dakar", "Hôpital"),
    ("Hôpital Aristide Le Dantec", "Dakar", "Hôpital"),
    ("CHR de Thiès", "Thiès", "CHR"),
    ("CHR de Saint-Louis", "Saint-Louis", "CHR"),
    ("CHR de Diourbel", "Diourbel", "CHR"),
    ("CHR de Fatick", "Fatick", "CHR"),
    ("CHR de Kaffrine", "Kaffrine", "CHR"),
    ("CHR de Kaolack", "Kaolack", "CHR"),
    ("CHR de Kédougou", "Kédougou", "CHR"),
    ("CHR de Kolda", "Kolda", "CHR"),
    ("CHR de Louga", "Louga", "CHR"),
    ("CHR de Matam", "Matam", "CHR"),
    ("CHR de Sédhiou", "Sédhiou", "CHR"),
    ("CHR de Tambacounda", "Tambacounda", "CHR"),
    ("CHR de Ziguinchor", "Ziguinchor", "CHR"),
]

# Stock initial (nb de poches DISPONIBLE) par hôpital et groupe. Le stock
# national par région (services/admin_service.stock_by_region) compare ce total
# à une cible de ``stock.ideal`` (config, 50 par défaut) par groupe ET par
# hôpital — donc pour qu'une région sorte du rouge il faut couvrir les 8
# groupes, pas seulement O+/A+. Volumes volontairement inégaux (quelques
# hôpitaux bien fournis, d'autres en tension ou en rupture) pour que le
# dashboard et la carte reflètent une vraie disparité plutôt qu'un réseau
# uniformément critique ou uniformément optimal.
STOCKS = {
    "CNTS Dakar": {BloodGroup.O_POS: 60, BloodGroup.O_NEG: 15, BloodGroup.A_POS: 45, BloodGroup.A_NEG: 10,
                   BloodGroup.B_POS: 25, BloodGroup.B_NEG: 6, BloodGroup.AB_POS: 8, BloodGroup.AB_NEG: 3},
    "Hôpital Principal de Dakar": {BloodGroup.O_POS: 25, BloodGroup.O_NEG: 5, BloodGroup.A_POS: 18, BloodGroup.A_NEG: 4,
                                    BloodGroup.B_POS: 10, BloodGroup.B_NEG: 2, BloodGroup.AB_POS: 3, BloodGroup.AB_NEG: 1},
    "Hôpital Aristide Le Dantec": {BloodGroup.O_POS: 15, BloodGroup.O_NEG: 3, BloodGroup.A_POS: 10, BloodGroup.A_NEG: 2,
                                    BloodGroup.B_POS: 6, BloodGroup.B_NEG: 1, BloodGroup.AB_POS: 2, BloodGroup.AB_NEG: 1},
    "CHR de Thiès": {BloodGroup.O_POS: 30, BloodGroup.O_NEG: 6, BloodGroup.A_POS: 22, BloodGroup.A_NEG: 5,
                      BloodGroup.B_POS: 12, BloodGroup.B_NEG: 3, BloodGroup.AB_POS: 4, BloodGroup.AB_NEG: 1},
    "CHR de Saint-Louis": {BloodGroup.O_POS: 20, BloodGroup.O_NEG: 3, BloodGroup.A_POS: 15, BloodGroup.A_NEG: 3,
                            BloodGroup.B_POS: 8, BloodGroup.B_NEG: 2, BloodGroup.AB_POS: 2, BloodGroup.AB_NEG: 1},
    "CHR de Diourbel": {BloodGroup.O_POS: 45, BloodGroup.O_NEG: 10, BloodGroup.A_POS: 32, BloodGroup.A_NEG: 7,
                         BloodGroup.B_POS: 18, BloodGroup.B_NEG: 4, BloodGroup.AB_POS: 5, BloodGroup.AB_NEG: 2},
    "CHR de Fatick": {BloodGroup.O_POS: 38, BloodGroup.O_NEG: 8, BloodGroup.A_POS: 28, BloodGroup.A_NEG: 6,
                       BloodGroup.B_POS: 16, BloodGroup.B_NEG: 3, BloodGroup.AB_POS: 4, BloodGroup.AB_NEG: 2},
    "CHR de Kaffrine": {BloodGroup.O_POS: 50, BloodGroup.O_NEG: 11, BloodGroup.A_POS: 36, BloodGroup.A_NEG: 8,
                         BloodGroup.B_POS: 20, BloodGroup.B_NEG: 5, BloodGroup.AB_POS: 6, BloodGroup.AB_NEG: 2},
    "CHR de Kaolack": {BloodGroup.O_POS: 22, BloodGroup.O_NEG: 4, BloodGroup.A_POS: 16, BloodGroup.A_NEG: 3,
                        BloodGroup.B_POS: 9, BloodGroup.B_NEG: 2, BloodGroup.AB_POS: 3, BloodGroup.AB_NEG: 1},
    "CHR de Kédougou": {BloodGroup.O_POS: 10, BloodGroup.O_NEG: 2, BloodGroup.A_POS: 7, BloodGroup.A_NEG: 1,
                         BloodGroup.B_POS: 4, BloodGroup.B_NEG: 1, BloodGroup.AB_POS: 1},
    "CHR de Kolda": {BloodGroup.O_POS: 55, BloodGroup.O_NEG: 12, BloodGroup.A_POS: 40, BloodGroup.A_NEG: 9,
                      BloodGroup.B_POS: 22, BloodGroup.B_NEG: 5, BloodGroup.AB_POS: 6, BloodGroup.AB_NEG: 3},
    "CHR de Louga": {BloodGroup.O_POS: 105, BloodGroup.O_NEG: 24, BloodGroup.A_POS: 78, BloodGroup.A_NEG: 18,
                      BloodGroup.B_POS: 42, BloodGroup.B_NEG: 11, BloodGroup.AB_POS: 13, BloodGroup.AB_NEG: 6},
    "CHR de Matam": {BloodGroup.O_POS: 8, BloodGroup.O_NEG: 1, BloodGroup.A_POS: 6, BloodGroup.A_NEG: 1,
                      BloodGroup.B_POS: 3, BloodGroup.AB_POS: 1},
    "CHR de Sédhiou": {BloodGroup.O_POS: 18, BloodGroup.O_NEG: 3, BloodGroup.A_POS: 12, BloodGroup.A_NEG: 2,
                        BloodGroup.B_POS: 7, BloodGroup.B_NEG: 1, BloodGroup.AB_POS: 2, BloodGroup.AB_NEG: 1},
    "CHR de Tambacounda": {BloodGroup.O_POS: 12, BloodGroup.O_NEG: 2, BloodGroup.A_POS: 9, BloodGroup.A_NEG: 2,
                            BloodGroup.B_POS: 5, BloodGroup.B_NEG: 1, BloodGroup.AB_POS: 1},
    "CHR de Ziguinchor": {BloodGroup.O_POS: 80, BloodGroup.O_NEG: 18, BloodGroup.A_POS: 58, BloodGroup.A_NEG: 13,
                           BloodGroup.B_POS: 32, BloodGroup.B_NEG: 8, BloodGroup.AB_POS: 10, BloodGroup.AB_NEG: 5},
}

DONORS = [
    ("Awa Ndiaye", "awa@donneur.sn", BloodGroup.O_NEG, "771111189", "Dakar"),
    ("Modou Fall", "modou@donneur.sn", BloodGroup.O_POS, "772223399", "Dakar"),
    ("Fatou Sarr", "fatou@donneur.sn", BloodGroup.A_POS, "773334477", "Thiès"),
    ("Ibrahima Ba", "ibrahima@donneur.sn", BloodGroup.B_POS, "774445566", "Saint-Louis"),
    ("Aissatou Diallo", "aissatou@donneur.sn", BloodGroup.O_POS, "775556677", "Kaolack"),
    ("Cheikh Gueye", "cheikh@donneur.sn", BloodGroup.AB_POS, "776667788", "Louga"),
    ("Ndeye Sow", "ndeye@donneur.sn", BloodGroup.A_NEG, "777778899", "Ziguinchor"),
]


def seed(force: bool = False) -> None:
    """Peuple la base — no-op si déjà peuplée, sauf ``force=True``.

    ``db_setup`` relance ce script à chaque ``docker compose up`` : sans ce
    garde-fou, toute donnée réelle créée depuis (transferts, nouvelles poches,
    comptes...) serait effacée et réinitialisée au jeu de démo à chaque
    redémarrage — pas seulement lors d'un ``down -v``.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not force and db.query(Hospital).count() > 0:
            print("Base déjà peuplée — seed ignoré (utiliser --force pour réinitialiser).")
            return

        # Réinitialisation (ordre respectant les FK) avant réinsertion du jeu de démo.
        # Region est supprimée après Hospital (qui la référence via region_id).
        for model in (AlertResponse, Alert, TransferOrder, BloodRequest, Donation,
                      Appointment, BloodPouch, CollectionPoint, DonorProfile, User, Hospital,
                      Region, Configuration):
            db.query(model).delete()
        db.commit()

        # Régions administratives (référence géographique de la carte nationale).
        regions: dict[str, Region] = {}
        for r in SENEGAL_REGIONS:
            region = Region(nom=r["name"], capitale=r["capital"], population=r["population"],
                             longitude=r["coords"][0], latitude=r["coords"][1])
            db.add(region)
            regions[r["name"]] = region
        db.flush()

        hospitals: dict[str, Hospital] = {}
        for nom, loc, typ in HOSPITALS:
            h = Hospital(nom=nom, region_id=regions[loc].id, type=typ)
            db.add(h)
            hospitals[nom] = h
        db.flush()

        cnts = hospitals["CNTS Dakar"]

        # Utilisateurs de démonstration.
        admin_user = User(nom="Admin CNTS", email="admin@cnts.sn",
                          password_hash=hash_password(PASSWORD), role=UserRole.ADMIN_CNTS.value)
        medic_user = User(nom="Dr Diop", email="medecin@cnts.sn",
                          password_hash=hash_password(PASSWORD),
                          role=UserRole.PERSONNEL_MEDICAL.value, hospital_id=cnts.id)
        demo_donor_user = User(nom="Donneur Démo", email="donneur@cnts.sn",
                               password_hash=hash_password(PASSWORD), role=UserRole.DONNEUR.value)
        db.add_all([admin_user, medic_user, demo_donor_user])
        db.flush()

        # Poches (source de vérité du stock), avec un mix réaliste de statuts.
        # ~78% DISPONIBLE, 10% RESERVEE, 8% UTILISEE, 4% PERIMEE (péremption passée).
        today = date.today()
        _status_pool = (
            [PouchStatus.DISPONIBLE] * 78 + [PouchStatus.RESERVEE] * 10
            + [PouchStatus.UTILISEE] * 8 + [PouchStatus.PERIMEE] * 4
        )
        pouch_rng = random.Random(7)
        for nom, stocks in STOCKS.items():
            hid = hospitals[nom].id
            for groupe, count in stocks.items():
                for _ in range(count):
                    uid = _generate_uid()
                    statut = pouch_rng.choice(_status_pool)
                    if statut is PouchStatus.PERIMEE:
                        peremption = today - timedelta(days=pouch_rng.randint(1, 15))
                    else:
                        peremption = today + timedelta(days=pouch_rng.randint(5, 42))
                    db.add(BloodPouch(
                        uid=uid, groupe_sanguin=groupe.value, hospital_id=hid,
                        statut=statut.value,
                        date_prelevement=today - timedelta(days=pouch_rng.randint(0, 20)),
                        date_peremption=peremption,
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

        # Un rendez-vous de démonstration pour le donneur démo.
        demo_profile = db.query(DonorProfile).filter(
            DonorProfile.user_id == demo_donor_user.id).one()
        db.add(Appointment(donor_id=demo_profile.id, collection_point_id=points[0].id,
                           date=datetime.now(timezone.utc) + timedelta(days=5),
                           statut=AppointmentStatus.PLANIFIE.value))

        hospital_ids = [h.id for h in hospitals.values()]
        rng = random.Random(42)  # déterministe

        # --- Historiques de dons par donneur (classement + gamification) ---------
        # (email → (nombre de dons, jours depuis le dernier don))
        DONATION_PLAN = {
            "donneur@cnts.sn": (7, 100),   # démo : éligible (100 j > 90 j)
            "awa@donneur.sn": (12, 30),
            "modou@donneur.sn": (9, 55),
            "fatou@donneur.sn": (6, 150),
            "ibrahima@donneur.sn": (3, 210),
            "aissatou@donneur.sn": (5, 45),
            "cheikh@donneur.sn": (2, 300),
            "ndeye@donneur.sn": (8, 20),
        }
        profiles_by_email = {
            u.email: p
            for u, p in db.query(User, DonorProfile)
            .join(DonorProfile, DonorProfile.user_id == User.id).all()
        }
        for email, (count, days_since_last) in DONATION_PLAN.items():
            profile = profiles_by_email[email]
            offset = days_since_last
            for _ in range(count):
                db.add(Donation(
                    donor_id=profile.id, collection_point_id=rng.choice(points).id,
                    groupe_sanguin=profile.groupe_sanguin, volume=rng.choice([400, 450, 500]),
                    date=today - timedelta(days=offset),
                ))
                offset += rng.randint(90, 130)  # dons espacés, remontant dans le temps

        # --- Historique de transferts réparti sur 30 jours (courbe journalière) ---
        groups = [g.value for g in BloodGroup]
        for _ in range(45):
            src, tgt = rng.sample(hospital_ids, 2)
            created = datetime.now(timezone.utc) - timedelta(
                days=rng.randint(0, 29), hours=rng.randint(0, 23))
            db.add(TransferOrder(
                source_hospital_id=src, target_hospital_id=tgt,
                groupe_sanguin=rng.choice(groups), quantite=rng.randint(1, 6),
                statut=TransferStatus.COMPLETED.value, created_by=admin_user.id,
                created_at=created,
            ))

        # --- Demandes de sang (répartition par urgence et statut) ---
        urgences = [Urgence.NORMALE, Urgence.NORMALE, Urgence.URGENTE,
                    Urgence.URGENTE, Urgence.CRITIQUE]
        statuts = [RequestStatus.OUVERTE, RequestStatus.OUVERTE,
                   RequestStatus.SATISFAITE, RequestStatus.ANNULEE]
        for _ in range(24):
            db.add(BloodRequest(
                hospital_id=rng.choice(hospital_ids), groupe_sanguin=rng.choice(groups),
                quantite=rng.randint(1, 8), urgence=rng.choice(urgences).value,
                statut=rng.choice(statuts).value, created_by=medic_user.id,
                created_at=datetime.now(timezone.utc) - timedelta(days=rng.randint(0, 20)),
            ))

        # Configuration par défaut
        from app.services.configuration_service import DEFAULT_CONFIGS
        for key, config_data in DEFAULT_CONFIGS.items():
            existing = db.query(Configuration).filter(Configuration.key == key).first()
            if existing is None:
                config = Configuration(
                    key=key,
                    value=config_data["value"],
                    description=config_data["description"],
                    category=config_data["category"],
                )
                db.add(config)

        db.commit()

        nb_pouches = db.query(BloodPouch).count()
        nb_donors = db.query(DonorProfile).count()
        nb_transfers = db.query(TransferOrder).count()
        nb_requests = db.query(BloodRequest).count()
        nb_dons = db.query(Donation).count()
        print(f"Seed terminé : {len(HOSPITALS)} hôpitaux, {nb_pouches} poches, "
              f"{nb_donors} donneurs, {nb_transfers} transferts, {nb_requests} demandes, "
              f"{nb_dons} dons, 3 comptes démo (mdp: {PASSWORD}).")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    seed(force="--force" in sys.argv)
