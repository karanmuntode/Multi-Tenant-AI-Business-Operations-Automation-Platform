"""
OpsPilot AI — Health Check Route
Production readiness probe for load balancers and monitoring.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint.
    Returns service status and database connectivity.
    """
    db_status = "connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "OpsPilot AI API",
        "version": "1.0.0",
        "database": db_status,
    }


@router.get("/readiness")
async def readiness_check():
    """Readiness probe — is the service ready to accept traffic?"""
    return {"ready": True}
