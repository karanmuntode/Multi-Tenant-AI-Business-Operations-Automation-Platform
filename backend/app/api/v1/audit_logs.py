"""
OpsPilot AI — Audit Logs API Routes
Tenant-scoped compliance and security audit trail.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("")
async def list_audit_logs(
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    action: Optional[str] = Query(None, description="Filter by action (created, updated, deleted)"),
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List audit log entries for the authenticated tenant."""
    query = (
        select(AuditLog, User.email, User.first_name, User.last_name)
        .outerjoin(User, AuditLog.user_id == User.id)
        .where(AuditLog.organization_id == current_user.organization_id)
    )

    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    if action:
        query = query.where(AuditLog.action == action)

    query = query.order_by(desc(AuditLog.created_at))

    count_query = select(func.count()).select_from(
        select(AuditLog.id).where(AuditLog.organization_id == current_user.organization_id).subquery()
    )
    total = await db.scalar(count_query) or 0

    offset = (page - 1) * per_page
    results = await db.execute(query.offset(offset).limit(per_page))
    rows = results.all()

    items = []
    for log, email, first_name, last_name in rows:
        user_name = f"{first_name or ''} {last_name or ''}".strip() or email or "System"
        items.append({
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "user_name": user_name,
            "user_email": email or "system@opspilot.local",
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": str(log.resource_id) if log.resource_id else None,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "ip_address": log.ip_address or "127.0.0.1",
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
    }
