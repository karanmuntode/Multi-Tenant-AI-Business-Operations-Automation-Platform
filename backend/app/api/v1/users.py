"""
OpsPilot AI — User Management Routes
CRUD operations for users within an organization (tenant-scoped).
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_client_ip,
    get_current_org_id,
    get_current_user,
    require_permissions,
)
from app.core.audit import create_audit_log
from app.core.permissions import Permission
from app.core.security import hash_password
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserListResponse, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    role: str = Query(None),
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
    _: User = Depends(require_permissions(Permission.VIEW_USERS)),
):
    """List all users in the current organization with pagination and filters."""
    query = select(User).where(User.organization_id == org_id)

    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (User.first_name.ilike(search_filter))
            | (User.last_name.ilike(search_filter))
            | (User.email.ilike(search_filter))
        )

    if role:
        query = query.where(User.role == role)

    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginated results
    query = query.offset((page - 1) * per_page).limit(per_page).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        users=[
            UserResponse(
                id=u.id,
                email=u.email,
                first_name=u.first_name,
                last_name=u.last_name,
                full_name=u.full_name,
                avatar_url=u.avatar_url,
                phone=u.phone,
                job_title=u.job_title,
                department=u.department,
                role=u.role.value,
                is_active=u.is_active,
                last_login=u.last_login,
                created_at=u.created_at,
                organization_id=u.organization_id,
            )
            for u in users
        ],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
    current_user: User = Depends(require_permissions(Permission.MANAGE_USERS)),
):
    """Create a new user in the current organization."""
    # Check if email is taken
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        job_title=data.job_title,
        department=data.department,
        role=UserRole(data.role),
        organization_id=org_id,
    )
    db.add(user)
    await db.flush()

    # Audit log
    await create_audit_log(
        db,
        organization_id=org_id,
        user_id=current_user.id,
        action="created",
        resource_type="user",
        resource_id=user.id,
        new_values={"email": user.email, "role": user.role.value},
        ip_address=get_client_ip(request),
    )

    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        phone=user.phone,
        job_title=user.job_title,
        department=user.department,
        role=user.role.value,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
        organization_id=user.organization_id,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
    _: User = Depends(require_permissions(Permission.VIEW_USERS)),
):
    """Get a specific user by ID (tenant-scoped)."""
    result = await db.execute(
        select(User).where(User.id == user_id, User.organization_id == org_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        phone=user.phone,
        job_title=user.job_title,
        department=user.department,
        role=user.role.value,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
        organization_id=user.organization_id,
    )


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
    current_user: User = Depends(require_permissions(Permission.MANAGE_USERS)),
):
    """Update a user's profile (tenant-scoped)."""
    result = await db.execute(
        select(User).where(User.id == user_id, User.organization_id == org_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_values = {}
    new_values = {}

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "role":
            value = UserRole(value)
        old_val = getattr(user, field)
        if old_val != value:
            old_values[field] = str(old_val) if old_val else None
            new_values[field] = str(value) if value else None
            setattr(user, field, value)

    if new_values:
        await create_audit_log(
            db,
            organization_id=org_id,
            user_id=current_user.id,
            action="updated",
            resource_type="user",
            resource_id=user.id,
            old_values=old_values,
            new_values=new_values,
            ip_address=get_client_ip(request),
        )

    await db.flush()

    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        phone=user.phone,
        job_title=user.job_title,
        department=user.department,
        role=user.role.value,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
        organization_id=user.organization_id,
    )
