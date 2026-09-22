"""
OpsPilot AI — Database Engine & Session
Async SQLAlchemy setup with PostgreSQL.
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# Async engine for FastAPI
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

engine_kwargs = {"echo": settings.DEBUG}
if not is_sqlite:
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 3600,
    })

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency that yields an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables and seed default admin account for local dev."""
    # Import all models to ensure they are registered with Base.metadata
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default organization and admin user if empty
    async with async_session_factory() as session:
        from sqlalchemy import select
        from app.models.organization import Organization
        from app.models.user import User, UserRole
        from app.models.subscription import Subscription, PlanTier, PLAN_LIMITS
        from app.core.security import hash_password

        res = await session.execute(select(User).where(User.email == settings.SUPER_ADMIN_EMAIL))
        if not res.scalar_one_or_none():
            org = Organization(
                name="Acme Corp Operations",
                slug="acme-corp",
                industry="Technology & SaaS",
            )
            session.add(org)
            await session.flush()

            admin_user = User(
                organization_id=org.id,
                email=settings.SUPER_ADMIN_EMAIL,
                password_hash=hash_password(settings.SUPER_ADMIN_PASSWORD),
                first_name="Admin",
                last_name="OpsPilot",
                role=UserRole.ORG_ADMIN,
                job_title="Director of Operations",
                department="Engineering",
            )
            session.add(admin_user)

            limits = PLAN_LIMITS[PlanTier.ENTERPRISE]
            sub = Subscription(
                organization_id=org.id,
                plan=PlanTier.ENTERPRISE,
                max_users=limits["max_users"],
                max_projects=limits["max_projects"],
                sla_management=limits["sla_management"],
                ai_enabled=limits["ai_enabled"],
                audit_logs=limits["audit_logs"],
                api_access=limits["api_access"],
            )
            session.add(sub)
            await session.commit()
