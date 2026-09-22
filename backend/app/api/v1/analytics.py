"""
OpsPilot AI — Analytics Routes
Dashboard analytics aggregations (tenant-scoped).
"""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_org_id, get_current_user
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.task import Task, TaskStatus
from app.models.incident import Incident, IncidentStatus, IncidentSeverity

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard_analytics(
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
    _: User = Depends(get_current_user),
):
    """Get aggregated analytics for the dashboard KPI cards and charts."""

    # ── KPI Cards ────────────────────────────
    total_users = await db.execute(
        select(func.count(User.id)).where(User.organization_id == org_id, User.is_active == True)
    )
    total_projects = await db.execute(
        select(func.count(Project.id)).where(Project.organization_id == org_id)
    )
    total_tasks = await db.execute(
        select(func.count(Task.id)).where(Task.organization_id == org_id)
    )
    total_incidents = await db.execute(
        select(func.count(Incident.id)).where(Incident.organization_id == org_id)
    )

    # ── Task Status Distribution ──────────────
    task_status_query = (
        select(Task.status, func.count(Task.id))
        .where(Task.organization_id == org_id)
        .group_by(Task.status)
    )
    task_status_result = await db.execute(task_status_query)
    task_by_status = {row[0].value: row[1] for row in task_status_result.all()}

    # ── Incident Severity Distribution ────────
    incident_severity_query = (
        select(Incident.severity, func.count(Incident.id))
        .where(Incident.organization_id == org_id)
        .group_by(Incident.severity)
    )
    incident_severity_result = await db.execute(incident_severity_query)
    incidents_by_severity = {row[0].value: row[1] for row in incident_severity_result.all()}

    # ── Open Incidents ────────────────────────
    open_incidents = await db.execute(
        select(func.count(Incident.id)).where(
            Incident.organization_id == org_id,
            Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING, IncidentStatus.IN_PROGRESS]),
        )
    )

    # ── SLA Performance ──────────────────────
    sla_met = await db.execute(
        select(func.count(Incident.id)).where(
            Incident.organization_id == org_id,
            Incident.sla_resolution_met == True,
        )
    )
    sla_total = await db.execute(
        select(func.count(Incident.id)).where(
            Incident.organization_id == org_id,
            Incident.sla_resolution_met.isnot(None),
        )
    )

    sla_met_count = sla_met.scalar() or 0
    sla_total_count = sla_total.scalar() or 0
    sla_performance = round((sla_met_count / sla_total_count * 100), 1) if sla_total_count > 0 else 100.0

    return {
        "kpi": {
            "total_users": total_users.scalar() or 0,
            "total_projects": total_projects.scalar() or 0,
            "total_tasks": total_tasks.scalar() or 0,
            "total_incidents": total_incidents.scalar() or 0,
            "open_incidents": open_incidents.scalar() or 0,
            "sla_performance": sla_performance,
        },
        "task_distribution": task_by_status,
        "incident_severity": incidents_by_severity,
    }
