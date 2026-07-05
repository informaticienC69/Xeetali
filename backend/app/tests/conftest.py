"""Fixtures de test : base SQLite EN MÉMOIRE + override de ``get_db``.

Aucune fixture n'utilise la base réelle : chaque test s'exécute sur une base
isolée en mémoire, créée puis détruite autour du test.
"""
from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
import app.models  # noqa: F401  (enregistre les modèles)
from app.main import app
from app.models.hospital import Hospital
from app.models.inventory import BloodInventory
from app.schemas.enums import BloodGroup


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
    """TestClient avec ``get_db`` surchargé pour pointer vers la base en mémoire."""

    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture()
def seeded(db_session: Session) -> dict[str, int]:
    """Deux hôpitaux avec des stocks connus.

    - Source (id source) : O+ = 10, A+ = 5
    - Cible (id target)  : O+ = 2  (pas de A+ → teste la création de ligne cible)
    Retourne les ids pour usage dans les tests.
    """
    source = Hospital(nom="Hôpital Source", localisation="Dakar", type="Hôpital")
    target = Hospital(nom="Hôpital Cible", localisation="Thiès", type="CHR")
    db_session.add_all([source, target])
    db_session.flush()

    db_session.add_all([
        BloodInventory(hospital_id=source.id, groupe_sanguin=BloodGroup.O_POS.value, quantite=10),
        BloodInventory(hospital_id=source.id, groupe_sanguin=BloodGroup.A_POS.value, quantite=5),
        BloodInventory(hospital_id=target.id, groupe_sanguin=BloodGroup.O_POS.value, quantite=2),
    ])
    db_session.commit()
    return {"source_id": source.id, "target_id": target.id}
