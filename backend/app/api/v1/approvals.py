"""
OpsPilot AI — Approvals API Routes
Human-in-the-Loop governance for AI Agent actions.
"""

from typing import Any, Dict, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.approval import ApprovalActionType, ApprovalRequest, ApprovalRiskLevel, ApprovalStatus
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter(prefix="/approvals", tags=["Human-in-the-Loop Approvals"])


class ApprovalCreateSchema(BaseModel):
    requested_by_agent: str = Field(default="Communication Agent")
    action_type: ApprovalActionType = ApprovalActionType.SEND_EMAIL
    risk_level: ApprovalRiskLevel = ApprovalRiskLevel.MEDIUM
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    payload: Dict[str, Any] = Field(default_factory=dict)


class ApprovalRejectSchema(BaseModel):
    reason: str = Field(..., min_length=2, max_length=500)


@router.get("")
async def list_approvals(
    status_filter: Optional[str] = Query(None, alias="status"),
    risk_filter: Optional[str] = Query(None, alias="risk_level"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List approval requests for the organization."""
    query = select(ApprovalRequest).where(ApprovalRequest.organization_id == current_user.organization_id)

    if status_filter:
        query = query.where(ApprovalRequest.status == status_filter)
    if risk_filter:
        query = query.where(ApprovalRequest.risk_level == risk_filter)

    query = query.order_by(desc(ApprovalRequest.created_at))

    count_query = select(func.count()).select_from(
        select(ApprovalRequest.id).where(ApprovalRequest.organization_id == current_user.organization_id).subquery()
    )
    total = await db.scalar(count_query) or 0

    offset = (page - 1) * per_page
    results = await db.scalars(query.offset(offset).limit(per_page))
    items = results.all()

    return {
        "items": [
            {
                "id": str(appr.id),
                "requested_by_agent": appr.requested_by_agent,
                "action_type": appr.action_type.value,
                "risk_level": appr.risk_level.value,
                "status": appr.status.value,
                "title": appr.title,
                "description": appr.description,
                "payload": appr.payload,
                "reviewer_id": str(appr.reviewer_id) if appr.reviewer_id else None,
                "rejection_reason": appr.rejection_reason,
                "created_at": appr.created_at.isoformat() if appr.created_at else None,
                "updated_at": appr.updated_at.isoformat() if appr.updated_at else None,
            }
            for appr in items
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_approval(
    data: ApprovalCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new human approval request (called by AI agents or integrations)."""
    approval = ApprovalRequest(
        organization_id=current_user.organization_id,
        requested_by_agent=data.requested_by_agent,
        action_type=data.action_type,
        risk_level=data.risk_level,
        status=ApprovalStatus.PENDING,
        title=data.title,
        description=data.description,
        payload=data.payload,
    )
    db.add(approval)
    await db.flush()

    # Log to audit trail
    audit_log = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="created",
        resource_type="approval_request",
        resource_id=approval.id,
        new_values={"title": approval.title, "risk_level": approval.risk_level.value},
    )
    db.add(audit_log)
    await db.commit()

    return {
        "id": str(approval.id),
        "status": approval.status.value,
        "title": approval.title,
        "risk_level": approval.risk_level.value,
    }


@router.post("/{approval_id}/approve")
async def approve_action(
    approval_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve an action in the approval queue."""
    approval = await db.get(ApprovalRequest, approval_id)
    if not approval or approval.organization_id != current_user.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found")

    if approval.status != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval request is already {approval.status.value}",
        )

    approval.status = ApprovalStatus.APPROVED
    approval.reviewer_id = current_user.id

    # Emit audit log
    audit_log = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="approved",
        resource_type="approval_request",
        resource_id=approval.id,
        new_values={"status": "APPROVED", "reviewer": current_user.email},
    )
    db.add(audit_log)
    await db.commit()

    return {
        "status": "APPROVED",
        "id": str(approval_id),
        "message": f"Action '{approval.title}' has been successfully approved and dispatched for execution.",
    }


@router.post("/{approval_id}/reject")
async def reject_action(
    approval_id: UUID,
    data: ApprovalRejectSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject an action in the approval queue."""
    approval = await db.get(ApprovalRequest, approval_id)
    if not approval or approval.organization_id != current_user.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found")

    if approval.status != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval request is already {approval.status.value}",
        )

    approval.status = ApprovalStatus.REJECTED
    approval.reviewer_id = current_user.id
    approval.rejection_reason = data.reason

    audit_log = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="rejected",
        resource_type="approval_request",
        resource_id=approval.id,
        new_values={"status": "REJECTED", "reason": data.reason},
    )
    db.add(audit_log)
    await db.commit()

    return {
        "status": "REJECTED",
        "id": str(approval_id),
        "message": f"Action '{approval.title}' has been rejected. Reason: {data.reason}",
    }
