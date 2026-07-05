"""Routes d'administration (réservées ADMIN_CNTS)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import AnalyticsResponse, DashboardStats
from app.schemas.alert import AlertCreate, AlertDispatchResult
from app.schemas.enums import UserRole
from app.schemas.hospital import HospitalCreate, HospitalRead, HospitalUpdate
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services import admin_service, alert_service

router = APIRouter(
    prefix="/api/admin", tags=["administration"], dependencies=[Depends(require_role(UserRole.ADMIN_CNTS))]
)


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db)) -> DashboardStats:
    """Agrégats nationaux du tableau de bord CNTS."""
    return admin_service.dashboard(db)


@router.get("/analytics", response_model=AnalyticsResponse)
def analytics(db: Session = Depends(get_db)) -> AnalyticsResponse:
    """Agrégations complètes pour le dashboard graphique (100 % issues de la BD)."""
    return admin_service.analytics(db)


# --- Utilisateurs ---------------------------------------------------------- #
@router.get("/users", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db)) -> list[UserRead]:
    return [UserRead.model_validate(u) for u in admin_service.list_users(db)]


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    return UserRead.model_validate(admin_service.create_user(db, payload))


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)) -> UserRead:
    return UserRead.model_validate(admin_service.update_user(db, user_id, payload))


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)) -> None:
    admin_service.delete_user(db, user_id)


# --- Établissements -------------------------------------------------------- #
@router.get("/hospitals", response_model=list[HospitalRead])
def list_hospitals(db: Session = Depends(get_db)) -> list[HospitalRead]:
    return [HospitalRead.model_validate(h) for h in admin_service.list_hospitals(db)]


@router.post("/hospitals", response_model=HospitalRead, status_code=status.HTTP_201_CREATED)
def create_hospital(payload: HospitalCreate, db: Session = Depends(get_db)) -> HospitalRead:
    return HospitalRead.model_validate(admin_service.create_hospital(db, payload))


@router.patch("/hospitals/{hospital_id}", response_model=HospitalRead)
def update_hospital(
    hospital_id: int, payload: HospitalUpdate, db: Session = Depends(get_db)
) -> HospitalRead:
    return HospitalRead.model_validate(admin_service.update_hospital(db, hospital_id, payload))


@router.delete("/hospitals/{hospital_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hospital(hospital_id: int, db: Session = Depends(get_db)) -> None:
    admin_service.delete_hospital(db, hospital_id)


# --- Campagne nationale ---------------------------------------------------- #
@router.post("/campaigns", response_model=AlertDispatchResult, status_code=status.HTTP_201_CREATED)
def launch_campaign(
    payload: AlertCreate, db: Session = Depends(get_db), current: User = Depends(require_role(UserRole.ADMIN_CNTS))
) -> AlertDispatchResult:
    """Campagne d'alerte nationale (portée nationale : ignore la localisation)."""
    payload.localisation = None  # force la portée nationale
    return alert_service.dispatch_alert(db, payload, current.id)
