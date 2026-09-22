"""
OpsPilot AI — Approval Model
Human-in-the-Loop decision gateway for AI Agent actions.
"""

import enum
from sqlalchemy import Column, Enum, ForeignKey, JSON, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class ApprovalRiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ApprovalActionType(str, enum.Enum):
    SEND_EMAIL = "SEND_EMAIL"
    MODIFY_DATABASE = "MODIFY_DATABASE"
    EXECUTE_RUNBOOK = "EXECUTE_RUNBOOK"
    EXTERNAL_WEBHOOK = "EXTERNAL_WEBHOOK"
    ESCALATE_INCIDENT = "ESCALATE_INCIDENT"


class ApprovalRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Holds medium- and high-risk AI agent proposed actions until human review.
    """
    __tablename__ = "approval_requests"

    requested_by_agent = Column(String(100), nullable=False, default="Communication Agent")
    action_type = Column(
        Enum(ApprovalActionType, name="approval_action_type"),
        default=ApprovalActionType.SEND_EMAIL,
        nullable=False,
    )
    risk_level = Column(
        Enum(ApprovalRiskLevel, name="approval_risk_level"),
        default=ApprovalRiskLevel.MEDIUM,
        nullable=False,
    )
    status = Column(
        Enum(ApprovalStatus, name="approval_status"),
        default=ApprovalStatus.PENDING,
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    payload = Column(JSON, nullable=False, default=dict)  # drafted email, recipient, SQL query diff, etc.
    
    reviewer_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Relationships
    reviewer = relationship("User", foreign_keys=[reviewer_id])

    def __repr__(self):
        return f"<ApprovalRequest {self.title} [{self.status.value}]>"
