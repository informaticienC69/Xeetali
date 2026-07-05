"""Logique métier d'administration : dashboard, analytics, CRUD users/hôpitaux."""
from __future__ import annotations

from collections import Counter
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.alert import Alert
from app.models.donation import Donation
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.models.request import BloodRequest
from app.models.transfer import TransferOrder
from app.models.user import User
from app.schemas.admin import (
    AnalyticsResponse,
    DashboardStats,
    LabeledCount,
    NationalStockLine,
    TimePoint,
)
from app.schemas.enums import AlertStatus, BloodGroup, PouchStatus, RequestStatus, Urgence
from app.schemas.hospital import HospitalCreate, HospitalUpdate
from app.schemas.user import UserCreate, UserUpdate
from app.services.exceptions import ConflictError, HospitalNotFoundError, NotFoundError

# Ordre d'affichage stable des groupes sanguins.
_GROUP_ORDER = [g.value for g in (
    BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.A_NEG, BloodGroup.A_POS,
    BloodGroup.B_NEG, BloodGroup.B_POS, BloodGroup.AB_NEG, BloodGroup.AB_POS,
)]


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
# Analytics (dashboard graphique) — 100 % dérivé de la BD
# --------------------------------------------------------------------------- #
def _grouped_counts(db: Session, column, where=None) -> dict[str, int]:
    stmt = select(column, func.count()).group_by(column)
    if where is not None:
        stmt = stmt.where(where)
    return {str(k): int(v) for k, v in db.execute(stmt).all()}


def analytics(db: Session) -> AnalyticsResponse:
    """Agrège toutes les métriques du dashboard graphique depuis la base.

    Le bucketing temporel est fait en Python (indépendant du SGBD).
    """
    today = date.today()
    available = BloodPouch.statut == PouchStatus.DISPONIBLE.value

    # Répartitions catégorielles ------------------------------------------------
    stock_groupe = _grouped_counts(db, BloodPouch.groupe_sanguin, available)
    stock_par_groupe = [
        LabeledCount(label=g, value=stock_groupe.get(g, 0)) for g in _GROUP_ORDER
    ]

    statut_counts = _grouped_counts(db, BloodPouch.statut)
    poches_par_statut = [
        LabeledCount(label=s.value, value=statut_counts.get(s.value, 0)) for s in PouchStatus
    ]

    donors_groupe = _grouped_counts(db, DonorProfile.groupe_sanguin)
    donneurs_par_groupe = [
        LabeledCount(label=g, value=donors_groupe.get(g, 0))
        for g in _GROUP_ORDER
        if donors_groupe.get(g, 0) > 0
    ]

    urgence_counts = _grouped_counts(db, BloodRequest.urgence)
    demandes_par_urgence = [
        LabeledCount(label=u.value, value=urgence_counts.get(u.value, 0)) for u in Urgence
    ]

    # Stock disponible par hôpital (top, décroissant) ---------------------------
    rows = db.execute(
        select(Hospital.nom, func.count(BloodPouch.id))
        .join(BloodPouch, BloodPouch.hospital_id == Hospital.id)
        .where(available)
        .group_by(Hospital.id)
        .order_by(func.count(BloodPouch.id).desc())
    ).all()
    stock_par_hopital = [LabeledCount(label=nom, value=int(c)) for nom, c in rows]

    # Séries temporelles --------------------------------------------------------
    since_30 = datetime.now(timezone.utc) - timedelta(days=29)
    transfer_dates = db.scalars(
        select(TransferOrder.created_at).where(TransferOrder.created_at >= since_30)
    ).all()
    day_counter: Counter[str] = Counter(d.date().isoformat() for d in transfer_dates)
    transferts_par_jour = [
        TimePoint(date=(day := (today - timedelta(days=29 - i))).isoformat(),
                  value=day_counter.get(day.isoformat(), 0))
        for i in range(30)
    ]

    donation_dates = db.scalars(select(Donation.date)).all()
    month_counter: Counter[str] = Counter(d.strftime("%Y-%m") for d in donation_dates)
    months: list[str] = []
    cursor = today.replace(day=1)
    for _ in range(6):
        months.append(cursor.strftime("%Y-%m"))
        cursor = (cursor - timedelta(days=1)).replace(day=1)
    dons_par_mois = [
        TimePoint(date=m, value=month_counter.get(m, 0)) for m in reversed(months)
    ]

    # Indicateurs clés ----------------------------------------------------------
    total_dispo = sum(l.value for l in stock_par_groupe)
    expirant_7j = int(
        db.scalar(
            select(func.count(BloodPouch.id)).where(
                available, BloodPouch.date_peremption <= today + timedelta(days=7)
            )
        ) or 0
    )
    dons_6_mois = sum(p.value for p in dons_par_mois)

    return AnalyticsResponse(
        total_poches_disponibles=total_dispo,
        nb_hopitaux=int(db.scalar(select(func.count(Hospital.id))) or 0),
        nb_donneurs=int(db.scalar(select(func.count(DonorProfile.id))) or 0),
        demandes_ouvertes=int(
            db.scalar(select(func.count(BloodRequest.id)).where(
                BloodRequest.statut == RequestStatus.OUVERTE.value)) or 0
        ),
        alertes_actives=int(
            db.scalar(select(func.count(Alert.id)).where(
                Alert.statut == AlertStatus.ACTIVE.value)) or 0
        ),
        poches_expirant_7j=expirant_7j,
        total_transferts=int(db.scalar(select(func.count(TransferOrder.id))) or 0),
        dons_6_mois=dons_6_mois,
        stock_par_groupe=stock_par_groupe,
        poches_par_statut=poches_par_statut,
        stock_par_hopital=stock_par_hopital,
        donneurs_par_groupe=donneurs_par_groupe,
        demandes_par_urgence=demandes_par_urgence,
        transferts_par_jour=transferts_par_jour,
        dons_par_mois=dons_par_mois,
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
