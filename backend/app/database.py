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
            await session.flush()

            # Seed sample project
            from datetime import datetime, timezone, timedelta
            from app.models.project import Project, ProjectStatus
            from app.models.task import Task, TaskStatus, TaskPriority
            from app.models.incident import Incident, IncidentSeverity, IncidentCategory, IncidentStatus
            from app.models.audit_log import AuditLog, Notification, NotificationType

            project = Project(
                organization_id=org.id,
                name="Core Platform Modernization",
                description="Zero-downtime microservices cutover, multi-region database migration, and Redis cluster scaling.",
                color="#6366F1",
                status=ProjectStatus.ACTIVE,
            )
            session.add(project)
            await session.flush()

            # Seed tasks across Kanban columns
            sample_tasks = [
                Task(
                    organization_id=org.id,
                    project_id=project.id,
                    title="Implement tenant-scoped Redis rate limiting middleware",
                    description="Token bucket rate limiter per API key and JWT tenant id to prevent tenant noisy-neighbor issues.",
                    priority=TaskPriority.HIGH,
                    status=TaskStatus.TODO,
                    estimated_hours=6,
                    assignee_id=admin_user.id,
                ),
                Task(
                    organization_id=org.id,
                    project_id=project.id,
                    title="Configure pgvector RLS embeddings pipeline",
                    description="Enable pgvector extension with tenant isolation policies on document embeddings vector store.",
                    priority=TaskPriority.CRITICAL,
                    status=TaskStatus.IN_PROGRESS,
                    estimated_hours=8,
                    assignee_id=admin_user.id,
                ),
                Task(
                    organization_id=org.id,
                    project_id=project.id,
                    title="Setup Prometheus FastAPI instrumentator and Grafana dashboard",
                    description="Export latency histograms, request throughput, and Redis connection pool utilization metrics.",
                    priority=TaskPriority.MEDIUM,
                    status=TaskStatus.REVIEW,
                    estimated_hours=4,
                    assignee_id=admin_user.id,
                ),
                Task(
                    organization_id=org.id,
                    project_id=project.id,
                    title="Deploy Docker Compose multi-service architecture",
                    description="Containerize FastAPI, React 19 SPA, PostgreSQL 16, Redis 7, and health check probes.",
                    priority=TaskPriority.LOW,
                    status=TaskStatus.DONE,
                    estimated_hours=5,
                    assignee_id=admin_user.id,
                ),
            ]
            session.add_all(sample_tasks)

            # Seed sample incidents with SLA
            now = datetime.now(timezone.utc)
            incidents = [
                Incident(
                    organization_id=org.id,
                    incident_number="INC-2026-00101",
                    title="Checkout API 504 Gateway Timeouts under Flash Traffic",
                    description="Postgres connection pool saturation on rds-prod-cluster. 14% failure rate on checkout requests.",
                    severity=IncidentSeverity.CRITICAL,
                    category=IncidentCategory.DATABASE,
                    status=IncidentStatus.INVESTIGATING,
                    reporter_id=admin_user.id,
                    assignee_id=admin_user.id,
                    sla_response_due=now + timedelta(minutes=15),
                    sla_resolution_due=now + timedelta(hours=2),
                ),
                Incident(
                    organization_id=org.id,
                    incident_number="INC-2026-00102",
                    title="Payment Gateway Webhook SSL Certificate Expiration Warning",
                    description="Stripe webhook endpoint TLS cert expiring in 72 hours. Renewal automated script failed.",
                    severity=IncidentSeverity.HIGH,
                    category=IncidentCategory.SECURITY,
                    status=IncidentStatus.IDENTIFIED,
                    reporter_id=admin_user.id,
                    assignee_id=admin_user.id,
                    sla_response_due=now + timedelta(minutes=30),
                    sla_resolution_due=now + timedelta(hours=4),
                ),
                Incident(
                    organization_id=org.id,
                    incident_number="INC-2026-00103",
                    title="CDN Edge Cache Invalidation Delay in AP-South Region",
                    description="Asset updates on static storage taking up to 45 minutes to propagate to regional edge points.",
                    severity=IncidentSeverity.MEDIUM,
                    category=IncidentCategory.NETWORK,
                    status=IncidentStatus.RESOLVED,
                    reporter_id=admin_user.id,
                    assignee_id=admin_user.id,
                    sla_response_due=now - timedelta(hours=3),
                    sla_resolution_due=now - timedelta(hours=1),
                    sla_response_met=True,
                    sla_resolution_met=True,
                    resolution_notes="Flushed edge POP caches via CloudFront API and adjusted TTL header to 300s.",
                ),
            ]
            session.add_all(incidents)

            # Seed notifications
            notifications = [
                Notification(
                    organization_id=org.id,
                    user_id=admin_user.id,
                    title="Critical Incident INC-2026-00101 Raised",
                    message="Checkout API 504 Gateway Timeouts require immediate triage. SLA response timer active.",
                    type=NotificationType.INCIDENT,
                    is_read=False,
                ),
                Notification(
                    organization_id=org.id,
                    user_id=admin_user.id,
                    title="Task Assigned: pgvector RLS Pipeline",
                    message="You have been assigned as lead engineer on 'Configure pgvector RLS embeddings pipeline'.",
                    type=NotificationType.TASK,
                    is_read=False,
                ),
                Notification(
                    organization_id=org.id,
                    user_id=admin_user.id,
                    title="SLA Met: CDN Edge Cache Invalidation",
                    message="Incident INC-2026-00103 successfully resolved within SLA window (94.2% operational health).",
                    type=NotificationType.SLA,
                    is_read=True,
                ),
            ]
            session.add_all(notifications)

            # Seed audit logs
            audit_logs = [
                AuditLog(
                    organization_id=org.id,
                    user_id=admin_user.id,
                    action="created",
                    resource_type="project",
                    resource_id=project.id,
                    new_values={"name": "Core Platform Modernization", "color": "#6366F1"},
                    ip_address="192.168.1.100",
                ),
                AuditLog(
                    organization_id=org.id,
                    user_id=admin_user.id,
                    action="created",
                    resource_type="incident",
                    resource_id=incidents[0].id if incidents else project.id,
                    new_values={"number": "INC-2026-00101", "severity": "P1_CRITICAL"},
                    ip_address="192.168.1.100",
                ),
            ]
            session.add_all(audit_logs)

            # Seed sample Approval Requests
            from app.models.approval import ApprovalRequest, ApprovalActionType, ApprovalRiskLevel, ApprovalStatus
            sample_approvals = [
                ApprovalRequest(
                    organization_id=org.id,
                    requested_by_agent="Communication Agent",
                    action_type=ApprovalActionType.SEND_EMAIL,
                    risk_level=ApprovalRiskLevel.HIGH,
                    status=ApprovalStatus.PENDING,
                    title="Dispatch SLA Outage Advisory to Enterprise Customers",
                    description="AI Agent drafted an outage status report for incident INC-2026-00101 regarding checkout transaction errors. Human approval required before external customer email dispatch.",
                    payload={
                        "recipient": "enterprise-customers@acme-corp.com",
                        "subject": "OpsPilot Advisory: Temporary Checkout Latency & Mitigation",
                        "body": "Dear Valued Customer, our SRE team has identified an intermittent latency event affecting checkout processing. Remediation is underway and expected within 30 minutes.",
                        "triggered_by": "INC-2026-00101",
                    },
                ),
                ApprovalRequest(
                    organization_id=org.id,
                    requested_by_agent="Data Agent",
                    action_type=ApprovalActionType.EXECUTE_RUNBOOK,
                    risk_level=ApprovalRiskLevel.MEDIUM,
                    status=ApprovalStatus.PENDING,
                    title="Scale RDS Connection Pool via PgBouncer Proxy",
                    description="Data Agent detected connection count exceeding 92% of maximum pool threshold. Proposes applying Runbook RB-DB-04 to scale connection pool limits.",
                    payload={
                        "runbook": "RB-DB-04: High Concurrency Connection Saturation",
                        "target_cluster": "rds-prod-primary",
                        "parameter_changes": {"max_connections": 400, "pool_mode": "transaction"},
                    },
                ),
            ]
            session.add_all(sample_approvals)

            await session.commit()
