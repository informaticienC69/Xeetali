"""Logique métier d'administration : dashboard, analytics, CRUD users/hôpitaux."""
from __future__ import annotations

from collections import Counter
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.alert import Alert
from app.models.donation import Donation
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.models.region import Region
from app.models.request import BloodRequest
from app.models.transfer import TransferOrder
from app.models.user import User
from app.schemas.admin import (
    AnalyticsResponse,
    DashboardStats,
    LabeledCount,
    NationalStockLine,
    RegionBloodGroupStock,
    RegionStock,
    TimePoint,
)
from app.schemas.enums import AlertStatus, BloodGroup, PouchStatus, RequestStatus, Urgence
from app.schemas.hospital import HospitalCreate, HospitalUpdate
from app.schemas.user import UserCreate, UserUpdate
from app.services.configuration_service import get_config_value
from app.services.exceptions import ConflictError, HospitalNotFoundError, NotFoundError, RegionNotFoundError

# Ordre d'affichage stable des groupes sanguins.
_GROUP_ORDER = [g.value for g in (
    BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.A_NEG, BloodGroup.A_POS,
    BloodGroup.B_NEG, BloodGroup.B_POS, BloodGroup.AB_NEG, BloodGroup.AB_POS,
)]


# --------------------------------------------------------------------------- #
# Dashboard
# --------------------------------------------------------------------------- #
async def dashboard(db: AsyncSession) -> DashboardStats:
    """Agrège les indicateurs nationaux (stock via comptage des poches)."""
    rows = (await db.execute(
        select(BloodPouch.groupe_sanguin, func.count(BloodPouch.id))
        .where(BloodPouch.statut == PouchStatus.DISPONIBLE.value)
        .group_by(BloodPouch.groupe_sanguin)
    )).all()
    par_groupe = [
        NationalStockLine(groupe_sanguin=BloodGroup(groupe), quantite=count)
        for groupe, count in sorted(rows, key=lambda r: r[0])
    ]
    total = sum(line.quantite for line in par_groupe)

    return DashboardStats(
        total_poches_disponibles=total,
        stock_national_par_groupe=par_groupe,
        nb_hopitaux=int(await db.scalar(select(func.count(Hospital.id))) or 0),
        nb_donneurs=int(await db.scalar(select(func.count(DonorProfile.id))) or 0),
        demandes_ouvertes=int(
            await db.scalar(
                select(func.count(BloodRequest.id)).where(
                    BloodRequest.statut == RequestStatus.OUVERTE.value
                )
            )
            or 0
        ),
        alertes_actives=int(
            await db.scalar(
                select(func.count(Alert.id)).where(Alert.statut == AlertStatus.ACTIVE.value)
            )
            or 0
        ),
    )


# --------------------------------------------------------------------------- #
# Analytics (dashboard graphique) — 100 % dérivé de la BD
# --------------------------------------------------------------------------- #
async def _grouped_counts(db: AsyncSession, column, where=None) -> dict[str, int]:
    stmt = select(column, func.count()).group_by(column)
    if where is not None:
        stmt = stmt.where(where)
    return {str(k): int(v) for k, v in (await db.execute(stmt)).all()}


async def analytics(db: AsyncSession) -> AnalyticsResponse:
    """Agrège toutes les métriques du dashboard graphique depuis la base.

    Le bucketing temporel est fait en Python (indépendant du SGBD).
    """
    today = date.today()
    available = BloodPouch.statut == PouchStatus.DISPONIBLE.value

    # Répartitions catégorielles ------------------------------------------------
    stock_groupe = await _grouped_counts(db, BloodPouch.groupe_sanguin, available)
    stock_par_groupe = [
        LabeledCount(label=g, value=stock_groupe.get(g, 0)) for g in _GROUP_ORDER
    ]

    statut_counts = await _grouped_counts(db, BloodPouch.statut)
    poches_par_statut = [
        LabeledCount(label=s.value, value=statut_counts.get(s.value, 0)) for s in PouchStatus
    ]

    donors_groupe = await _grouped_counts(db, DonorProfile.groupe_sanguin)
    donneurs_par_groupe = [
        LabeledCount(label=g, value=donors_groupe.get(g, 0))
        for g in _GROUP_ORDER
        if donors_groupe.get(g, 0) > 0
    ]

    urgence_counts = await _grouped_counts(db, BloodRequest.urgence)
    demandes_par_urgence = [
        LabeledCount(label=u.value, value=urgence_counts.get(u.value, 0)) for u in Urgence
    ]

    # Stock disponible par hôpital (top 8, décroissant) — le graphique est un
    # classement des meneurs, pas un inventaire exhaustif ; sans limite, sa
    # hauteur grandit avec chaque hôpital ajouté au réseau.
    rows = (await db.execute(
        select(Hospital.nom, func.count(BloodPouch.id))
        .join(BloodPouch, BloodPouch.hospital_id == Hospital.id)
        .where(available)
        .group_by(Hospital.id)
        .order_by(func.count(BloodPouch.id).desc())
        .limit(8)
    )).all()
    stock_par_hopital = [LabeledCount(label=nom, value=int(c)) for nom, c in rows]

    # Séries temporelles --------------------------------------------------------
    since_30 = datetime.now(timezone.utc) - timedelta(days=29)
    transfer_dates = (await db.scalars(
        select(TransferOrder.created_at).where(TransferOrder.created_at >= since_30)
    )).all()
    day_counter: Counter[str] = Counter(d.date().isoformat() for d in transfer_dates)
    transferts_par_jour = [
        TimePoint(date=(day := (today - timedelta(days=29 - i))).isoformat(),
                  value=day_counter.get(day.isoformat(), 0))
        for i in range(30)
    ]

    donation_dates = (await db.scalars(select(Donation.date))).all()
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
    total_dispo = sum(line.value for line in stock_par_groupe)
    expirant_7j = int(
        await db.scalar(
            select(func.count(BloodPouch.id)).where(
                available, BloodPouch.date_peremption <= today + timedelta(days=7)
            )
        ) or 0
    )
    dons_6_mois = sum(p.value for p in dons_par_mois)

    return AnalyticsResponse(
        total_poches_disponibles=total_dispo,
        nb_hopitaux=int(await db.scalar(select(func.count(Hospital.id))) or 0),
        nb_donneurs=int(await db.scalar(select(func.count(DonorProfile.id))) or 0),
        demandes_ouvertes=int(
            await db.scalar(select(func.count(BloodRequest.id)).where(
                BloodRequest.statut == RequestStatus.OUVERTE.value)) or 0
        ),
        alertes_actives=int(
            await db.scalar(select(func.count(Alert.id)).where(
                Alert.statut == AlertStatus.ACTIVE.value)) or 0
        ),
        poches_expirant_7j=expirant_7j,
        total_transferts=int(await db.scalar(select(func.count(TransferOrder.id))) or 0),
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
# Stock par région (carte nationale) — 100 % dérivé de la BD.
# --------------------------------------------------------------------------- #
def _region_status(nb_hopitaux: int, stock_pct: float) -> str:
    """Statut régional (mêmes seuils que la légende carte).

    Une région sans établissement n'est pas « critique » (rien à approvisionner
    là-bas) : ``hors_reseau`` évite de l'afficher comme une urgence sur la carte.
    """
    if nb_hopitaux == 0:
        return "hors_reseau"
    if stock_pct > 50:
        return "optimal"
    if stock_pct > 20:
        return "tension"
    return "critique"


async def list_regions(db: AsyncSession) -> list[Region]:
    return list((await db.scalars(select(Region).order_by(Region.nom))).all())


async def stock_by_region(db: AsyncSession) -> list[RegionStock]:
    """Agrège le stock de poches DISPONIBLE par région (via ``Hospital.region_id``).

    Toutes les régions de la table ``regions`` sont renvoyées (y compris à 0
    hôpital) ; la cible par groupe = seuil de stock idéal (config) × nb
    hôpitaux de la région.
    """
    available = BloodPouch.statut == PouchStatus.DISPONIBLE.value
    ideal_stock = int(await get_config_value(db, "stock.ideal", 50))

    regions = await list_regions(db)

    hosp_rows = (await db.execute(
        select(Hospital.region_id, func.count(Hospital.id)).group_by(Hospital.region_id)
    )).all()
    hosp_counts: dict[int, int] = {rid: int(c) for rid, c in hosp_rows}

    rows = (await db.execute(
        select(Hospital.region_id, BloodPouch.groupe_sanguin, func.count(BloodPouch.id))
        .join(BloodPouch, BloodPouch.hospital_id == Hospital.id)
        .where(available)
        .group_by(Hospital.region_id, BloodPouch.groupe_sanguin)
    )).all()
    stock_by_region_id: dict[int, dict[str, int]] = {}
    for rid, groupe, count in rows:
        stock_by_region_id.setdefault(rid, {})[groupe] = int(count)

    req_rows = (await db.execute(
        select(Hospital.region_id, func.count(BloodRequest.id))
        .join(BloodRequest, BloodRequest.hospital_id == Hospital.id)
        .where(
            BloodRequest.statut == RequestStatus.OUVERTE.value,
            BloodRequest.urgence.in_([Urgence.URGENTE.value, Urgence.CRITIQUE.value]),
        )
        .group_by(Hospital.region_id)
    )).all()
    urgent_by_region_id: dict[int, int] = {rid: int(c) for rid, c in req_rows}

    result: list[RegionStock] = []
    for region in regions:
        nb_hopitaux = hosp_counts.get(region.id, 0)
        cible = ideal_stock * nb_hopitaux
        groupe_counts = stock_by_region_id.get(region.id, {})
        groupes = [
            RegionBloodGroupStock(groupe_sanguin=BloodGroup(g), quantite=groupe_counts.get(g, 0), cible=cible)
            for g in _GROUP_ORDER
        ]
        total_poches = sum(g.quantite for g in groupes)
        total_cible = cible * len(_GROUP_ORDER)
        stock_pct = round(min(total_poches / total_cible, 1.0) * 100, 1) if total_cible > 0 else 0.0
        result.append(RegionStock(
            nom=region.nom, capitale=region.capitale, population=region.population,
            coords=[region.longitude, region.latitude],
            nb_hopitaux=nb_hopitaux, total_poches=total_poches, stock_pct=stock_pct,
            statut=_region_status(nb_hopitaux, stock_pct), demandes_urgentes=urgent_by_region_id.get(region.id, 0),
            groupes=groupes,
        ))
    return result


# --------------------------------------------------------------------------- #
# CRUD Utilisateurs
# --------------------------------------------------------------------------- #
async def list_users(db: AsyncSession) -> list[User]:
    return list((await db.scalars(select(User).order_by(User.id))).all())


async def create_user(db: AsyncSession, payload: UserCreate) -> User:
    try:
        if (await db.scalars(select(User).where(User.email == payload.email))).one_or_none() is not None:
            raise ConflictError("Un compte existe déjà avec cet email.")
        if payload.hospital_id is not None and await db.get(Hospital, payload.hospital_id) is None:
            raise HospitalNotFoundError(f"Hôpital {payload.hospital_id} introuvable.")
        user = User(
            nom=payload.nom,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=payload.role.value,
            hospital_id=payload.hospital_id,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    except Exception:
        await db.rollback()
        raise
    return user


async def update_user(db: AsyncSession, user_id: int, payload: UserUpdate) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise NotFoundError(f"Utilisateur {user_id} introuvable.")
    try:
        if payload.nom is not None:
            user.nom = payload.nom
        if payload.role is not None:
            user.role = payload.role.value
        if payload.hospital_id is not None:
            if await db.get(Hospital, payload.hospital_id) is None:
                raise HospitalNotFoundError(f"Hôpital {payload.hospital_id} introuvable.")
            user.hospital_id = payload.hospital_id
        if payload.password is not None:
            user.password_hash = hash_password(payload.password)
        await db.commit()
        await db.refresh(user)
    except Exception:
        await db.rollback()
        raise
    return user


async def delete_user(db: AsyncSession, user_id: int) -> None:
    user = await db.get(User, user_id)
    if user is None:
        raise NotFoundError(f"Utilisateur {user_id} introuvable.")
    try:
        await db.delete(user)
        await db.commit()
    except Exception:
        await db.rollback()
        raise


# --------------------------------------------------------------------------- #
# CRUD Établissements
# --------------------------------------------------------------------------- #
async def list_hospitals(db: AsyncSession) -> list[Hospital]:
    return list((await db.scalars(select(Hospital).order_by(Hospital.id))).all())


async def create_hospital(db: AsyncSession, payload: HospitalCreate) -> Hospital:
    if await db.get(Region, payload.region_id) is None:
        raise RegionNotFoundError(f"Région {payload.region_id} introuvable.")
    try:
        hospital = Hospital(nom=payload.nom, region_id=payload.region_id, type=payload.type)
        db.add(hospital)
        await db.commit()
        # ``refresh()`` ne recharge pas les relations : re-sélectionner déclenche
        # le chargement ``selectin`` de ``region`` pour la sérialisation.
        hospital = (await db.scalars(select(Hospital).where(Hospital.id == hospital.id))).one()
    except Exception:
        await db.rollback()
        raise
    return hospital


async def update_hospital(db: AsyncSession, hospital_id: int, payload: HospitalUpdate) -> Hospital:
    hospital = await db.get(Hospital, hospital_id)
    if hospital is None:
        raise HospitalNotFoundError(f"Hôpital {hospital_id} introuvable.")
    if payload.region_id is not None and await db.get(Region, payload.region_id) is None:
        raise RegionNotFoundError(f"Région {payload.region_id} introuvable.")
    try:
        if payload.nom is not None:
            hospital.nom = payload.nom
        if payload.region_id is not None:
            hospital.region_id = payload.region_id
        if payload.type is not None:
            hospital.type = payload.type
        await db.commit()
        # ``populate_existing`` : ``hospital`` est déjà dans l'identity map avec
        # son ancienne relation ``region`` chargée (via ``db.get`` ci-dessus) —
        # sans ça, un changement de région ne serait pas reflété dans la réponse.
        hospital = (await db.scalars(
            select(Hospital).where(Hospital.id == hospital.id).execution_options(populate_existing=True)
        )).one()
    except Exception:
        await db.rollback()
        raise
    return hospital


async def delete_hospital(db: AsyncSession, hospital_id: int) -> None:
    hospital = await db.get(Hospital, hospital_id)
    if hospital is None:
        raise HospitalNotFoundError(f"Hôpital {hospital_id} introuvable.")
    try:
        await db.delete(hospital)
        await db.commit()
    except Exception:
        await db.rollback()
        raise
