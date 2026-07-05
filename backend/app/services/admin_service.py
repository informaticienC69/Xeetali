"""Logique métier d'administration : dashboard, CRUD users/hôpitaux."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.alert import Alert
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.models.request import BloodRequest
from app.models.user import User
from app.schemas.admin import DashboardStats, NationalStockLine
from app.schemas.enums import AlertStatus, BloodGroup, PouchStatus, RequestStatus
from app.schemas.hospital import HospitalCreate, HospitalUpdate
from app.schemas.user import UserCreate, UserUpdate
from app.services.exceptions import ConflictError, HospitalNotFoundError, NotFoundError


# --------------------------------------------------------------------------- #
# Dashboard
# --------------------------------------------------------------------------- #
def dashboard(db: Session) -> DashboardStats:
    """Agrège les indicateurs nationaux (stock via comptage des poches)."""
    rows = db.execute(
        select(BloodPouch.groupe_sanguin, func.count(BloodPouch.id))
        .where(BloodPouch.statut == PouchStatus.DISPONIBLE.value)
        .group_by(BloodPouch.groupe_sanguin)
    ).all()
    par_groupe = [
        NationalStockLine(groupe_sanguin=BloodGroup(groupe), quantite=count)
        for groupe, count in sorted(rows, key=lambda r: r[0])
    ]
    total = sum(line.quantite for line in par_groupe)

    return DashboardStats(
        total_poches_disponibles=total,
        stock_national_par_groupe=par_groupe,
        nb_hopitaux=int(db.scalar(select(func.count(Hospital.id))) or 0),
        nb_donneurs=int(db.scalar(select(func.count(DonorProfile.id))) or 0),
        demandes_ouvertes=int(
            db.scalar(
                select(func.count(BloodRequest.id)).where(
                    BloodRequest.statut == RequestStatus.OUVERTE.value
                )
            )
            or 0
        ),
        alertes_actives=int(
            db.scalar(
                select(func.count(Alert.id)).where(Alert.statut == AlertStatus.ACTIVE.value)
            )
            or 0
        ),
    )


# --------------------------------------------------------------------------- #
# CRUD Utilisateurs
# --------------------------------------------------------------------------- #
def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)).all())


def create_user(db: Session, payload: UserCreate) -> User:
    try:
        if db.scalars(select(User).where(User.email == payload.email)).one_or_none() is not None:
            raise ConflictError("Un compte existe déjà avec cet email.")
        if payload.hospital_id is not None and db.get(Hospital, payload.hospital_id) is None:
            raise HospitalNotFoundError(f"Hôpital {payload.hospital_id} introuvable.")
        user = User(
            nom=payload.nom,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=payload.role.value,
            hospital_id=payload.hospital_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise
    return user


def update_user(db: Session, user_id: int, payload: UserUpdate) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError(f"Utilisateur {user_id} introuvable.")
    try:
        if payload.nom is not None:
            user.nom = payload.nom
        if payload.role is not None:
            user.role = payload.role.value
        if payload.hospital_id is not None:
            if db.get(Hospital, payload.hospital_id) is None:
                raise HospitalNotFoundError(f"Hôpital {payload.hospital_id} introuvable.")
            user.hospital_id = payload.hospital_id
        if payload.password is not None:
            user.password_hash = hash_password(payload.password)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise
    return user


def delete_user(db: Session, user_id: int) -> None:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError(f"Utilisateur {user_id} introuvable.")
    try:
        db.delete(user)
        db.commit()
    except Exception:
        db.rollback()
        raise


# --------------------------------------------------------------------------- #
# CRUD Établissements
# --------------------------------------------------------------------------- #
def list_hospitals(db: Session) -> list[Hospital]:
    return list(db.scalars(select(Hospital).order_by(Hospital.id)).all())


def create_hospital(db: Session, payload: HospitalCreate) -> Hospital:
    try:
        hospital = Hospital(nom=payload.nom, localisation=payload.localisation, type=payload.type)
        db.add(hospital)
        db.commit()
        db.refresh(hospital)
    except Exception:
        db.rollback()
        raise
    return hospital


def update_hospital(db: Session, hospital_id: int, payload: HospitalUpdate) -> Hospital:
    hospital = db.get(Hospital, hospital_id)
    if hospital is None:
        raise HospitalNotFoundError(f"Hôpital {hospital_id} introuvable.")
    try:
        if payload.nom is not None:
            hospital.nom = payload.nom
        if payload.localisation is not None:
            hospital.localisation = payload.localisation
        if payload.type is not None:
            hospital.type = payload.type
        db.commit()
        db.refresh(hospital)
    except Exception:
        db.rollback()
        raise
    return hospital


def delete_hospital(db: Session, hospital_id: int) -> None:
    hospital = db.get(Hospital, hospital_id)
    if hospital is None:
        raise HospitalNotFoundError(f"Hôpital {hospital_id} introuvable.")
    try:
        db.delete(hospital)
        db.commit()
    except Exception:
        db.rollback()
        raise
