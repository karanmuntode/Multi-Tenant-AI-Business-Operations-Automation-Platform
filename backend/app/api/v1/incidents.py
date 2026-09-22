"""
OpsPilot AI — Incidents API Routes
Tenant-scoped Incident & SLA Management with AI Triage integration.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.incident import Incident, IncidentCategory, IncidentSeverity, IncidentStatus
from app.models.user import User

router = APIRouter(prefix="/incidents", tags=["Incidents & SLA"])


class IncidentCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    description: Optional[str] = None
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    category: IncidentCategory = IncidentCategory.OTHER
    assignee_id: Optional[UUID] = None


class IncidentUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[IncidentSeverity] = None
    category: Optional[IncidentCategory] = None
    status: Optional[IncidentStatus] = None
    assignee_id: Optional[UUID] = None
    resolution_notes: Optional[str] = None


@router.get("")
async def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all incidents for the current tenant organization."""
    query = select(Incident).where(Incident.organization_id == current_user.organization_id)

    if status_filter:
        query = query.where(Incident.status == status_filter)
    if severity_filter:
        query = query.where(Incident.severity == severity_filter)

    query = query.order_by(desc(Incident.created_at))

    total = await db.scalar(
        select(func.count()).select_from(query.subquery())
    )

    offset = (page - 1) * per_page
    results = await db.scalars(query.offset(offset).limit(per_page))
    incidents = results.all()

    return {
        "items": [
            {
                "id": str(inc.id),
                "incident_number": inc.incident_number,
                "title": inc.title,
                "description": inc.description,
                "severity": inc.severity.value,
                "category": inc.category.value,
                "status": inc.status.value,
                "created_at": inc.created_at.isoformat() if inc.created_at else None,
                "sla_response_due": inc.sla_response_due.isoformat() if inc.sla_response_due else None,
                "sla_resolution_due": inc.sla_resolution_due.isoformat() if inc.sla_resolution_due else None,
                "sla_response_met": inc.sla_response_met,
                "sla_resolution_met": inc.sla_resolution_met,
            }
            for inc in incidents
        ],
        "total": total or 0,
        "page": page,
        "per_page": per_page,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_incident(
    data: IncidentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new incident and compute SLA deadlines based on severity."""
    # Generate sequential incident number
    count = await db.scalar(
        select(func.count(Incident.id)).where(Incident.organization_id == current_user.organization_id)
    )
    inc_num = f"INC-{(count or 0) + 101}"

    now = datetime.now(timezone.utc)
    # SLA calculation (P1: 15m/2h, P2: 30m/4h, P3: 2h/24h, P4: 8h/72h)
    sla_hours = {
        IncidentSeverity.CRITICAL: (0.25, 2),
        IncidentSeverity.HIGH: (0.5, 4),
        IncidentSeverity.MEDIUM: (2, 24),
        IncidentSeverity.LOW: (8, 72),
    }.get(data.severity, (2, 24))

    incident = Incident(
        organization_id=current_user.organization_id,
        reporter_id=current_user.id,
        incident_number=inc_num,
        title=data.title,
        description=data.description,
        severity=data.severity,
        category=data.category,
        status=IncidentStatus.OPEN,
        assignee_id=data.assignee_id,
        sla_response_due=now + timedelta(hours=sla_hours[0]),
        sla_resolution_due=now + timedelta(hours=sla_hours[1]),
    )
    db.add(incident)
    await db.commit()
    await db.refresh(incident)

    return {
        "id": str(incident.id),
        "incident_number": incident.incident_number,
        "title": incident.title,
        "severity": incident.severity.value,
        "status": incident.status.value,
        "created_at": incident.created_at.isoformat(),
    }


@router.patch("/{incident_id}")
async def update_incident(
    incident_id: UUID,
    data: IncidentUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update incident status, severity, or resolution notes."""
    result = await db.execute(
        select(Incident).where(
            Incident.id == incident_id,
            Incident.organization_id == current_user.organization_id,
        )
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if data.title is not None:
        incident.title = data.title
    if data.description is not None:
        incident.description = data.description
    if data.severity is not None:
        incident.severity = data.severity
    if data.category is not None:
        incident.category = data.category
    if data.status is not None:
        incident.status = data.status
        if data.status == IncidentStatus.RESOLVED and not incident.resolved_at:
            incident.resolved_at = datetime.now(timezone.utc)
            if incident.sla_resolution_due:
                incident.sla_resolution_met = incident.resolved_at <= incident.sla_resolution_due
    if data.assignee_id is not None:
        incident.assignee_id = data.assignee_id
    if data.resolution_notes is not None:
        incident.resolution_notes = data.resolution_notes

    await db.commit()
    return {"message": "Incident updated successfully"}
