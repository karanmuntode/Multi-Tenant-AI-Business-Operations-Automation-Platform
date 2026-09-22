"""
OpsPilot AI — Auth Routes
Organization registration, login, token refresh, and logout.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.config import get_settings
from app.database import get_db
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.subscription import Subscription, PlanTier, PLAN_LIMITS
from app.models.incident import SLAPolicy, IncidentSeverity
from app.schemas.user import (
    LoginRequest,
    RegisterOrganizationRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
)
from app.api.deps import get_current_user

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_organization(
    data: RegisterOrganizationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new organization and its first admin user.
    Creates the org, admin user, default subscription, and default SLA policies.
    """
    # Check if email already exists
    existing_user = await db.execute(
        select(User).where(User.email == data.email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Check if slug already exists
    existing_org = await db.execute(
        select(Organization).where(Organization.slug == data.org_slug)
    )
    if existing_org.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization slug already taken",
        )

    # Create organization
    org = Organization(
        name=data.org_name,
        slug=data.org_slug,
        industry=data.industry,
    )
    db.add(org)
    await db.flush()

    # Create admin user
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        role=UserRole.ORG_ADMIN,
        organization_id=org.id,
        last_login=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.flush()

    # Create default free subscription
    plan_limits = PLAN_LIMITS[PlanTier.FREE]
    subscription = Subscription(
        organization_id=org.id,
        plan=PlanTier.FREE,
        max_users=plan_limits["max_users"],
        max_projects=plan_limits["max_projects"],
        sla_management=plan_limits["sla_management"],
        ai_enabled=plan_limits["ai_enabled"],
        audit_logs=plan_limits["audit_logs"],
        api_access=plan_limits["api_access"],
        is_active=True,
    )
    db.add(subscription)

    # Create default SLA policies
    default_sla = [
        ("Critical SLA", IncidentSeverity.CRITICAL, 15, 120),
        ("High SLA", IncidentSeverity.HIGH, 30, 240),
        ("Medium SLA", IncidentSeverity.MEDIUM, 120, 480),
        ("Low SLA", IncidentSeverity.LOW, 480, 2880),
    ]
    for name, priority, response, resolution in default_sla:
        sla = SLAPolicy(
            organization_id=org.id,
            name=name,
            priority=priority,
            response_time_minutes=response,
            resolution_time_minutes=resolution,
        )
        db.add(sla)

    await db.flush()

    # Generate tokens
    access_token = create_access_token(user.id, org.id, user.role.value)
    refresh_token = create_refresh_token(user.id, org.id, user.role.value)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user and return JWT tokens."""
    result = await db.execute(
        select(User).where(User.email == data.email)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact your administrator.",
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await db.flush()

    access_token = create_access_token(user.id, user.organization_id, user.role.value)
    refresh_token = create_refresh_token(user.id, user.organization_id, user.role.value)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Exchange a refresh token for new access + refresh tokens."""
    payload = decode_token(data.refresh_token)

    if payload is None or payload.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    result = await db.execute(
        select(User).where(User.id == payload.sub)
    )
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )

    access_token = create_access_token(user.id, user.organization_id, user.role.value)
    new_refresh_token = create_refresh_token(user.id, user.organization_id, user.role.value)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """Get the current authenticated user's profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        phone=current_user.phone,
        job_title=current_user.job_title,
        department=current_user.department,
        role=current_user.role.value,
        is_active=current_user.is_active,
        last_login=current_user.last_login,
        created_at=current_user.created_at,
        organization_id=current_user.organization_id,
    )
