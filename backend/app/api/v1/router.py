"""
OpsPilot AI — API V1 Router
Aggregates all v1 route modules.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.health import router as health_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.ai import router as ai_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.projects import router as projects_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.notifications import router as notifications_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(health_router)
api_router.include_router(analytics_router)
api_router.include_router(incidents_router)
api_router.include_router(projects_router)
api_router.include_router(audit_logs_router)
api_router.include_router(notifications_router)
api_router.include_router(ai_router, prefix="/ai", tags=["AI Operations & Copilot"])
