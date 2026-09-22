"""
OpsPilot AI — Notifications API Routes
Tenant-scoped user notification inbox and status updates.
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.audit_log import Notification, NotificationType
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def list_notifications(
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List notifications for the current authenticated user."""
    query = select(Notification).where(
        Notification.organization_id == current_user.organization_id,
        Notification.user_id == current_user.id,
    )

    if unread_only:
        query = query.where(Notification.is_read == False)

    query = query.order_by(desc(Notification.created_at))

    count_query = select(func.count()).select_from(
        select(Notification.id).where(
            Notification.organization_id == current_user.organization_id,
            Notification.user_id == current_user.id,
        ).subquery()
    )
    total = await db.scalar(count_query) or 0

    unread_count_query = select(func.count()).select_from(
        select(Notification.id).where(
            Notification.organization_id == current_user.organization_id,
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        ).subquery()
    )
    unread_count = await db.scalar(unread_count_query) or 0

    offset = (page - 1) * per_page
    results = await db.scalars(query.offset(offset).limit(per_page))
    items = results.all()

    return {
        "items": [
            {
                "id": str(n.id),
                "title": n.title,
                "message": n.message,
                "type": n.type.value if hasattr(n.type, "value") else str(n.type),
                "is_read": n.is_read,
                "extra_data": n.extra_data or {},
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in items
        ],
        "total": total,
        "unread_count": unread_count,
        "page": page,
        "per_page": per_page,
    }


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    stmt = (
        update(Notification)
        .where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .values(is_read=True)
    )
    res = await db.execute(stmt)
    if res.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    await db.commit()
    return {"status": "success", "id": str(notification_id)}


@router.post("/read-all")
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all user notifications as read."""
    stmt = (
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()
    return {"status": "success", "message": "All notifications marked as read"}
