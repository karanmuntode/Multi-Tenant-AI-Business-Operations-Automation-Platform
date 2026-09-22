"""
OpsPilot AI — Incident & SLA Models
Incident tracking with automated SLA timers and breach detection.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class IncidentSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IncidentCategory(str, enum.Enum):
    INFRASTRUCTURE = "infrastructure"
    SOFTWARE = "software"
    NETWORK = "network"
    HARDWARE = "hardware"
    SECURITY = "security"
    OTHER = "other"


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Incident(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    __tablename__ = "incidents"

    incident_number = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(
        Enum(IncidentSeverity, name="incident_severity"),
        default=IncidentSeverity.MEDIUM,
        nullable=False,
    )
    category = Column(
        Enum(IncidentCategory, name="incident_category"),
        default=IncidentCategory.OTHER,
        nullable=False,
    )
    status = Column(
        Enum(IncidentStatus, name="incident_status"),
        default=IncidentStatus.OPEN,
        nullable=False,
    )

    # SLA tracking
    sla_policy_id = Column(Uuid(as_uuid=True), ForeignKey("sla_policies.id"), nullable=True)
    sla_response_due = Column(DateTime(timezone=True), nullable=True)
    sla_resolution_due = Column(DateTime(timezone=True), nullable=True)
    first_responded_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    sla_response_met = Column(Boolean, nullable=True)
    sla_resolution_met = Column(Boolean, nullable=True)

    resolution_notes = Column(Text, nullable=True)

    # Foreign Keys
    reporter_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assignee_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="incidents")
    reporter = relationship("User", back_populates="reported_incidents", foreign_keys=[reporter_id])
    assignee = relationship("User", back_populates="assigned_incidents", foreign_keys=[assignee_id])
    sla_policy = relationship("SLAPolicy")
    comments = relationship("IncidentComment", back_populates="incident", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Incident {self.incident_number} [{self.severity.value}]>"


class IncidentComment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "incident_comments"

    content = Column(Text, nullable=False)
    incident_id = Column(Uuid(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)

    incident = relationship("Incident", back_populates="comments")
    user = relationship("User")


class SLAPolicy(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    __tablename__ = "sla_policies"

    name = Column(String(100), nullable=False)
    priority = Column(
        Enum(IncidentSeverity, name="incident_severity", create_type=False),
        nullable=False,
    )
    response_time_minutes = Column(Integer, nullable=False)
    resolution_time_minutes = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="sla_policies")

    def __repr__(self):
        return f"<SLAPolicy {self.name} - {self.priority.value}>"
