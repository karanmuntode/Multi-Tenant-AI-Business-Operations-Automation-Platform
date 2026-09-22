"""
OpsPilot AI — Task Model
Tasks belong to a Project and are assigned to Users. Supports Kanban workflow.
"""

import enum

from sqlalchemy import Column, Date, Enum, ForeignKey, Integer, JSON, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class TaskPriority(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"


class Task(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    __tablename__ = "tasks"

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(
        Enum(TaskPriority, name="task_priority"),
        default=TaskPriority.MEDIUM,
        nullable=False,
    )
    status = Column(
        Enum(TaskStatus, name="task_status"),
        default=TaskStatus.TODO,
        nullable=False,
    )
    deadline = Column(Date, nullable=True)
    position = Column(Integer, default=0)  # Kanban ordering within a column
    labels = Column(JSON, default=list)
    estimated_hours = Column(Integer, nullable=True)

    # Foreign Keys
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    assignee_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks", foreign_keys=[assignee_id])
    creator = relationship("User", back_populates="created_tasks", foreign_keys=[created_by])
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Task {self.title} [{self.status.value}]>"


class TaskComment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "task_comments"

    content = Column(Text, nullable=False)
    task_id = Column(Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relationships
    task = relationship("Task", back_populates="comments")
    user = relationship("User")

    def __repr__(self):
        return f"<TaskComment on Task {self.task_id}>"
