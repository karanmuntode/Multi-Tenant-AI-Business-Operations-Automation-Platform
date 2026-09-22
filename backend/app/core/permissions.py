"""
OpsPilot AI — RBAC Permission System
Role-Based Access Control with granular permission checks.
"""

from enum import Enum
from typing import List

from fastapi import HTTPException, status

from app.models.user import UserRole


class Permission(str, Enum):
    """All permissions in the system."""

    # Organization
    MANAGE_ORGANIZATION = "manage_organization"
    VIEW_ORGANIZATION = "view_organization"

    # Users
    MANAGE_USERS = "manage_users"
    VIEW_USERS = "view_users"
    INVITE_USERS = "invite_users"

    # Projects
    CREATE_PROJECT = "create_project"
    EDIT_PROJECT = "edit_project"
    DELETE_PROJECT = "delete_project"
    VIEW_PROJECTS = "view_projects"

    # Tasks
    CREATE_TASK = "create_task"
    EDIT_TASK = "edit_task"
    DELETE_TASK = "delete_task"
    ASSIGN_TASK = "assign_task"
    VIEW_TASKS = "view_tasks"

    # Incidents
    CREATE_INCIDENT = "create_incident"
    EDIT_INCIDENT = "edit_incident"
    DELETE_INCIDENT = "delete_incident"
    ASSIGN_INCIDENT = "assign_incident"
    VIEW_INCIDENTS = "view_incidents"

    # SLA
    MANAGE_SLA = "manage_sla"
    VIEW_SLA = "view_sla"

    # Reports & Analytics
    VIEW_ANALYTICS = "view_analytics"
    EXPORT_REPORTS = "export_reports"

    # AI
    USE_AI = "use_ai"
    MANAGE_KNOWLEDGE_BASE = "manage_knowledge_base"

    # Approvals
    APPROVE_ACTIONS = "approve_actions"

    # Audit Logs
    VIEW_AUDIT_LOGS = "view_audit_logs"

    # Subscriptions
    MANAGE_SUBSCRIPTION = "manage_subscription"

    # Settings
    MANAGE_SETTINGS = "manage_settings"

    # Super Admin
    SUPER_ADMIN = "super_admin"


# ── Role → Permissions Mapping ────────────────
ROLE_PERMISSIONS: dict[UserRole, set[Permission]] = {
    UserRole.SUPER_ADMIN: set(Permission),  # All permissions

    UserRole.ORG_ADMIN: {
        Permission.MANAGE_ORGANIZATION,
        Permission.VIEW_ORGANIZATION,
        Permission.MANAGE_USERS,
        Permission.VIEW_USERS,
        Permission.INVITE_USERS,
        Permission.CREATE_PROJECT,
        Permission.EDIT_PROJECT,
        Permission.DELETE_PROJECT,
        Permission.VIEW_PROJECTS,
        Permission.CREATE_TASK,
        Permission.EDIT_TASK,
        Permission.DELETE_TASK,
        Permission.ASSIGN_TASK,
        Permission.VIEW_TASKS,
        Permission.CREATE_INCIDENT,
        Permission.EDIT_INCIDENT,
        Permission.DELETE_INCIDENT,
        Permission.ASSIGN_INCIDENT,
        Permission.VIEW_INCIDENTS,
        Permission.MANAGE_SLA,
        Permission.VIEW_SLA,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_REPORTS,
        Permission.USE_AI,
        Permission.MANAGE_KNOWLEDGE_BASE,
        Permission.APPROVE_ACTIONS,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MANAGE_SUBSCRIPTION,
        Permission.MANAGE_SETTINGS,
    },

    UserRole.MANAGER: {
        Permission.VIEW_ORGANIZATION,
        Permission.VIEW_USERS,
        Permission.CREATE_PROJECT,
        Permission.EDIT_PROJECT,
        Permission.VIEW_PROJECTS,
        Permission.CREATE_TASK,
        Permission.EDIT_TASK,
        Permission.ASSIGN_TASK,
        Permission.VIEW_TASKS,
        Permission.CREATE_INCIDENT,
        Permission.EDIT_INCIDENT,
        Permission.ASSIGN_INCIDENT,
        Permission.VIEW_INCIDENTS,
        Permission.VIEW_SLA,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_REPORTS,
        Permission.USE_AI,
        Permission.APPROVE_ACTIONS,
    },

    UserRole.EMPLOYEE: {
        Permission.VIEW_ORGANIZATION,
        Permission.VIEW_USERS,
        Permission.VIEW_PROJECTS,
        Permission.CREATE_TASK,
        Permission.EDIT_TASK,
        Permission.VIEW_TASKS,
        Permission.CREATE_INCIDENT,
        Permission.VIEW_INCIDENTS,
        Permission.VIEW_SLA,
        Permission.USE_AI,
    },
}


def has_permission(role: UserRole, permission: Permission) -> bool:
    """Check if a role has a specific permission."""
    permissions = ROLE_PERMISSIONS.get(role, set())
    return permission in permissions


def check_permissions(role: UserRole, required_permissions: List[Permission]) -> None:
    """
    Raise 403 if the role doesn't have ALL required permissions.
    Used in API route handlers.
    """
    for perm in required_permissions:
        if not has_permission(role, perm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {perm.value}",
            )


def require_role(*allowed_roles: UserRole):
    """
    Decorator/dependency that checks if the current user has one of the allowed roles.
    """
    def checker(current_user):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}",
            )
        return current_user
    return checker
