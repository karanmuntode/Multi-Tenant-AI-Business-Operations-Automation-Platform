"""
OpsPilot AI — Subscription Model
Controls feature access per organization based on plan tier.
"""

import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class PlanTier(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


# Plan feature limits — used by subscription enforcement logic
PLAN_LIMITS = {
    PlanTier.FREE: {
        "max_users": 5,
        "max_projects": 3,
        "sla_management": False,
        "ai_enabled": False,
        "audit_logs": False,
        "api_access": False,
        "advanced_analytics": False,
    },
    PlanTier.PRO: {
        "max_users": 50,
        "max_projects": -1,  # unlimited
        "sla_management": True,
        "ai_enabled": True,
        "audit_logs": False,
        "api_access": True,
        "advanced_analytics": True,
    },
    PlanTier.ENTERPRISE: {
        "max_users": -1,  # unlimited
        "max_projects": -1,
        "sla_management": True,
        "ai_enabled": True,
        "audit_logs": True,
        "api_access": True,
        "advanced_analytics": True,
    },
}


class Subscription(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "subscriptions"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    plan = Column(
        Enum(PlanTier, name="plan_tier"),
        default=PlanTier.FREE,
        nullable=False,
    )
    max_users = Column(Integer, default=5)
    max_projects = Column(Integer, default=3)
    sla_management = Column(Boolean, default=False)
    ai_enabled = Column(Boolean, default=False)
    audit_logs = Column(Boolean, default=False)
    api_access = Column(Boolean, default=False)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="subscription")

    def __repr__(self):
        return f"<Subscription {self.plan.value}>"
