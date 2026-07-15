"""Fixtures de test : base SQLite EN MÉMOIRE + override de ``get_db`` + auth.

Aucune fixture n'utilise la base réelle : chaque test s'exécute sur une base
isolée en mémoire, créée puis détruite autour du test.
"""
from __future__ import annotations

from collections.abc import AsyncGenerator, Callable
from datetime import date, timedelta

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.constants import SENEGAL_REGIONS
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
import app.models  # noqa: F401
from app.main import app
from app.models.collection_point import CollectionPoint
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.models.region import Region
from app.models.user import User
from app.schemas.enums import BloodGroup, PouchStatus, UserRole


@pytest_asyncio.fixture()
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Session sur une base SQLite en mémoire, partagée via ``StaticPool``."""
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    TestingSessionLocal = async_sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        await session.close()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()


@pytest_asyncio.fixture()
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """AsyncClient avec ``get_db`` surchargé vers la base en mémoire."""

    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac
    finally:
        app.dependency_overrides.clear()


async def _make_user(db: AsyncSession, email: str, role: UserRole, hospital_id: int | None = None) -> User:
    user = User(
        nom=email.split("@")[0].title(),
        email=email,
        password_hash=hash_password("Password123!"),
        role=role.value,
        hospital_id=hospital_id,
    )
    db.add(user)
    await db.flush()
    return user


@pytest_asyncio.fixture()
async def seeded(db_session: AsyncSession) -> dict[str, int | dict[str, int]]:
    """Les 14 régions, deux hôpitaux, un point de collecte, un utilisateur par rôle, un donneur."""
    regions: dict[str, Region] = {}
    for r in SENEGAL_REGIONS:
        region = Region(nom=r["name"], capitale=r["capital"], population=r["population"],
                         longitude=r["coords"][0], latitude=r["coords"][1])
        db_session.add(region)
        regions[r["name"]] = region
    await db_session.flush()

    source = Hospital(nom="Hôpital Source", region_id=regions["Dakar"].id, type="Hôpital")
    target = Hospital(nom="Hôpital Cible", region_id=regions["Thiès"].id, type="CHR")
    db_session.add_all([source, target])
    await db_session.flush()

    admin = await _make_user(db_session, "admin@cnts.sn", UserRole.ADMIN_CNTS)
    medic = await _make_user(db_session, "medic@cnts.sn", UserRole.PERSONNEL_MEDICAL, source.id)
    donor_user = await _make_user(db_session, "donor@cnts.sn", UserRole.DONNEUR)

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
    await db_session.commit()

    return {
        "source_id": source.id,
        "target_id": target.id,
        "admin_id": admin.id,
        "medic_id": medic.id,
        "donor_user_id": donor_user.id,
        "donor_id": donor.id,
        "collection_point_id": cp.id,
        "region_ids": {name: r.id for name, r in regions.items()},
    }


@pytest.fixture()
def auth(client: AsyncClient) -> Callable[[str], dict[str, str]]:
    """Retourne une fabrique d'en-têtes Authorization pour un email donné."""
    # This must be async to use AsyncClient
    async def _headers(email: str) -> dict[str, str]:
        resp = await client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
        assert resp.status_code == 200, resp.text
        return {"Authorization": f"Bearer {resp.json()['access_token']}"}

    return _headers
