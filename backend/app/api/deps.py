"""
OpsPilot AI — API Dependencies
Dependency injection for authentication, tenant isolation, and database sessions.
These are injected into every API route handler.
"""

from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.permissions import Permission, check_permissions
from app.core.security import decode_token
from app.database import get_db
from app.models.user import User, UserRole

settings = get_settings()
security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extract and validate JWT token, return the current User.
    This is the primary auth dependency.
    """
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Expected access token.",
        )

    # Fetch user from database
    result = await db.execute(
        select(User).where(User.id == UUID(payload.sub))
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user


async def get_current_org_id(
    current_user: User = Depends(get_current_user),
) -> UUID:
    """
    Extract the organization_id from the current user.
    This is the tenant isolation dependency — every tenant-scoped query
    MUST use this to filter data.
    """
    return current_user.organization_id


def require_permissions(*permissions: Permission):
    """
    Dependency factory: checks that the current user has ALL specified permissions.

    Usage:
        @router.post("/projects", dependencies=[Depends(require_permissions(Permission.CREATE_PROJECT))])
    """
    async def _check(current_user: User = Depends(get_current_user)):
        check_permissions(current_user.role, list(permissions))
        return current_user
    return _check


def require_roles(*roles: UserRole):
    """
    Dependency factory: checks that the current user has one of the specified roles.

    Usage:
        @router.get("/admin", dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
    """
    async def _check(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}",
            )
        return current_user
    return _check


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, accounting for proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
