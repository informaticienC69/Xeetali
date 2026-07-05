"""Fixtures de test : base SQLite EN MÉMOIRE + override de ``get_db`` + auth.

Aucune fixture n'utilise la base réelle : chaque test s'exécute sur une base
isolée en mémoire, créée puis détruite autour du test.
"""
from __future__ import annotations

from collections.abc import Callable, Generator
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
import app.models  # noqa: F401
from app.main import app
from app.models.collection_point import CollectionPoint
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.models.user import User
from app.schemas.enums import BloodGroup, PouchStatus, UserRole


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """Session sur une base SQLite en mémoire, partagée via ``StaticPool``."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """TestClient avec ``get_db`` surchargé vers la base en mémoire."""

    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def _make_user(db: Session, email: str, role: UserRole, hospital_id: int | None = None) -> User:
    user = User(
        nom=email.split("@")[0].title(),
        email=email,
        password_hash=hash_password("Password123!"),
        role=role.value,
        hospital_id=hospital_id,
    )
    db.add(user)
    db.flush()
    return user


@pytest.fixture()
def seeded(db_session: Session) -> dict[str, int]:
    """Deux hôpitaux, un point de collecte, un utilisateur par rôle, un donneur.

    Stocks (poches DISPONIBLE) à la source :
      - O+ = 5 poches (péremptions échelonnées)
      - A+ = 3 poches
    Cible : aucune poche.
    """
    source = Hospital(nom="Hôpital Source", localisation="Dakar", type="Hôpital")
    target = Hospital(nom="Hôpital Cible", localisation="Thiès", type="CHR")
    db_session.add_all([source, target])
    db_session.flush()

    admin = _make_user(db_session, "admin@cnts.sn", UserRole.ADMIN_CNTS)
    medic = _make_user(db_session, "medic@cnts.sn", UserRole.PERSONNEL_MEDICAL, source.id)
    donor_user = _make_user(db_session, "donor@cnts.sn", UserRole.DONNEUR)

    donor = DonorProfile(
        user_id=donor_user.id,
        groupe_sanguin=BloodGroup.O_NEG.value,
        telephone="771234589",
        localisation="Dakar",
    )
    db_session.add(donor)

    cp = CollectionPoint(nom="Centre CNTS Dakar", localisation="Dakar", hospital_id=source.id)
    db_session.add(cp)

    today = date.today()
    for i in range(5):
        db_session.add(BloodPouch(
            uid=f"SEED-OP-{i}", groupe_sanguin=BloodGroup.O_POS.value, hospital_id=source.id,
            statut=PouchStatus.DISPONIBLE.value, date_prelevement=today,
            date_peremption=today + timedelta(days=10 + i), qr_code_b64="data:image/png;base64,TEST",
        ))
    for i in range(3):
        db_session.add(BloodPouch(
            uid=f"SEED-AP-{i}", groupe_sanguin=BloodGroup.A_POS.value, hospital_id=source.id,
            statut=PouchStatus.DISPONIBLE.value, date_prelevement=today,
            date_peremption=today + timedelta(days=20 + i), qr_code_b64="data:image/png;base64,TEST",
        ))
    db_session.commit()

    return {
        "source_id": source.id,
        "target_id": target.id,
        "admin_id": admin.id,
        "medic_id": medic.id,
        "donor_user_id": donor_user.id,
        "donor_id": donor.id,
        "collection_point_id": cp.id,
    }


@pytest.fixture()
def auth(client: TestClient) -> Callable[[str], dict[str, str]]:
    """Retourne une fabrique d'en-têtes Authorization pour un email donné.

    Tous les utilisateurs de ``seeded`` partagent le mot de passe ``Password123!``.
    """

    def _headers(email: str) -> dict[str, str]:
        resp = client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
        assert resp.status_code == 200, resp.text
        return {"Authorization": f"Bearer {resp.json()['access_token']}"}

    return _headers
