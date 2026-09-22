"""
OpsPilot AI — Pytest Configuration & Fixtures
Provides async SQLite in-memory database, auth tokens, and isolated tenants for testing.
"""

import asyncio
from typing import AsyncGenerator
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import create_access_token, hash_password
from app.database import Base, get_db
from app.main import app
from app.models.organization import Organization
from app.models.subscription import PlanTier, Subscription
from app.models.user import User, UserRole

# Use SQLite in-memory engine for fast, isolated testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def prepare_database():
    """Create all schema tables before each test and drop them after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with test_session_factory() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP test client bound to FastAPI application."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver/api/v1") as ac:
        yield ac


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_session_factory() as session:
        yield session


@pytest.fixture
async def tenant_a(db_session: AsyncSession) -> dict:
    """Tenant A: Acme Corp."""
    org = Organization(name="Acme Corp", slug="acme-corp", industry="Tech")
    db_session.add(org)
    await db_session.flush()

    user = User(
        organization_id=org.id,
        email="admin@acme.com",
        password_hash=hash_password("Password123!"),
        first_name="Alice",
        last_name="Acme",
        role=UserRole.ORG_ADMIN,
    )
    db_session.add(user)

    sub = Subscription(organization_id=org.id, plan=PlanTier.ENTERPRISE)
    db_session.add(sub)
    await db_session.commit()

    token = create_access_token(data={"sub": str(user.id), "org_id": str(org.id), "role": user.role.value})
    return {"org": org, "user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture
async def tenant_b(db_session: AsyncSession) -> dict:
    """Tenant B: Globex Systems."""
    org = Organization(name="Globex Systems", slug="globex-systems", industry="Manufacturing")
    db_session.add(org)
    await db_session.flush()

    user = User(
        organization_id=org.id,
        email="admin@globex.com",
        password_hash=hash_password("Password123!"),
        first_name="Bob",
        last_name="Globex",
        role=UserRole.ORG_ADMIN,
    )
    db_session.add(user)

    sub = Subscription(organization_id=org.id, plan=PlanTier.PRO)
    db_session.add(sub)
    await db_session.commit()

    token = create_access_token(data={"sub": str(user.id), "org_id": str(org.id), "role": user.role.value})
    return {"org": org, "user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}
