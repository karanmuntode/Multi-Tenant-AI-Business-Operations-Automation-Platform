"""
OpsPilot AI — Audit Log & Notification Models
Enterprise audit trail and in-app notification system.
"""

import enum

from sqlalchemy import Boolean, Column, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class AuditLog(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Records WHO did WHAT, WHEN, and WHERE.
    Every state-changing operation creates an audit log entry.
    """
    __tablename__ = "audit_logs"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)  # created, updated, deleted
    resource_type = Column(String(50), nullable=False, index=True)  # project, task, incident, etc.
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    old_values = Column(JSONB, nullable=True)  # Previous state
    new_values = Column(JSONB, nullable=True)  # New state
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog {self.action} {self.resource_type}>"


class NotificationType(str, enum.Enum):
    TASK = "task"
    INCIDENT = "incident"
    SLA = "sla"
    APPROVAL = "approval"
    SYSTEM = "system"
    AI = "ai"


class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """In-app notification for users."""
    __tablename__ = "notifications"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(
        Enum(NotificationType, name="notification_type"),
        default=NotificationType.SYSTEM,
        nullable=False,
    )
    is_read = Column(Boolean, default=False, nullable=False)
    extra_data = Column("extra_data", JSONB, default=dict, server_default="{}")

    # Relationships
    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification {self.title} [{self.type.value}]>"
