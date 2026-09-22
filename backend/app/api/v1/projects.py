"""
OpsPilot AI — Projects & Tasks API Routes
Tenant-scoped Project and Kanban Task Management.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Projects & Tasks"])


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = "#6366F1"


class TaskCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=500)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    estimated_hours: Optional[int] = 4


class TaskStatusUpdateRequest(BaseModel):
    status: TaskStatus


@router.get("")
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all projects for the tenant organization with task counts."""
    projects = await db.scalars(
        select(Project)
        .where(Project.organization_id == current_user.organization_id)
        .order_by(desc(Project.created_at))
    )
    result = []
    for p in projects.all():
        task_count = await db.scalar(
            select(func.count(Task.id)).where(Task.project_id == p.id)
        )
        result.append({
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "status": p.status.value,
            "color": p.color,
            "task_count": task_count or 0,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    return {"items": result}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new project."""
    project = Project(
        organization_id=current_user.organization_id,
        created_by=current_user.id,
        name=data.name,
        description=data.description,
        color=data.color or "#6366F1",
        status=ProjectStatus.ACTIVE,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return {
        "id": str(project.id),
        "name": project.name,
        "status": project.status.value,
    }


@router.get("/{project_id}/tasks")
async def list_project_tasks(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks for a project grouped by Kanban column."""
    tasks = await db.scalars(
        select(Task)
        .where(
            Task.project_id == project_id,
            Task.organization_id == current_user.organization_id,
        )
        .order_by(Task.position, desc(Task.created_at))
    )
    return {
        "items": [
            {
                "id": str(t.id),
                "title": t.title,
                "description": t.description,
                "priority": t.priority.value,
                "status": t.status.value,
                "estimated_hours": t.estimated_hours,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tasks.all()
        ]
    }


@router.post("/{project_id}/tasks", status_code=status.HTTP_201_CREATED)
async def create_project_task(
    project_id: UUID,
    data: TaskCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a task inside a project."""
    task = Task(
        organization_id=current_user.organization_id,
        created_by=current_user.id,
        project_id=project_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        status=data.status,
        estimated_hours=data.estimated_hours,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return {
        "id": str(task.id),
        "title": task.title,
        "status": task.status.value,
    }


@router.patch("/tasks/{task_id}/status")
async def update_task_status(
    task_id: UUID,
    data: TaskStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update task status for Kanban drag & drop."""
    result = await db.execute(
        select(Task).where(
            Task.id == task_id,
            Task.organization_id == current_user.organization_id,
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = data.status
    await db.commit()
    return {"message": "Task status updated"}
