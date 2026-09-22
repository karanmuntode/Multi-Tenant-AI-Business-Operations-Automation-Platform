import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import declared_attr


class TimestampMixin:
    """Adds created_at and updated_at to any model."""

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class TenantMixin:
    """
    Multi-Tenancy Mixin — Every tenant-scoped model includes organization_id.
    This is the foundation of data isolation.
    """

    @declared_attr
    def organization_id(cls):
        return Column(
            Uuid(as_uuid=True),
            ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )


class UUIDPrimaryKeyMixin:
    """UUID primary key for all models."""

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
