"""
OpsPilot AI — AI Operations API Routes
Endpoints for automated incident triage, AI copilot chat, and task decomposition.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.models.user import User
from app.services.ai_service import ai_service

router = APIRouter()


class IncidentTriageRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, example="Database connection pool exhausted")
    description: str = Field(..., min_length=10, example="500 Internal Server Errors spiking across checkout service. RDS CPU at 98%.")
    affected_system: Optional[str] = Field(None, example="Checkout API / PostgreSQL")


class IncidentTriageResponse(BaseModel):
    suggested_severity: str
    confidence_score: float
    category: str
    root_cause_analysis: str
    immediate_mitigation_steps: List[str]
    recommended_runbook: str
    estimated_resolution_minutes: int


class CopilotChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, example="What are the best practices for setting up SLA alerts for P1 incidents?")


class CopilotChatResponse(BaseModel):
    response: str
    status: str = "success"


class TaskDecomposeRequest(BaseModel):
    goal: str = Field(..., min_length=5, max_length=1000, example="Migrate customer auth service to OAuth2/OIDC")


class TaskDecomposeResponse(BaseModel):
    subtasks: List[Dict[str, Any]]


@router.get("/status")
async def get_ai_status(current_user: User = Depends(get_current_user)):
    """Check if the Gemini AI Operations service is configured and ready."""
    return {
        "status": "ready" if ai_service.is_configured() else "unconfigured",
        "model": ai_service.model,
        "features": ["incident_triage", "copilot_chat", "task_decomposition"],
    }


@router.post("/triage", response_model=IncidentTriageResponse)
async def triage_incident_endpoint(
    data: IncidentTriageRequest,
    current_user: User = Depends(get_current_user),
):
    """
    AI-powered Incident Triage & Root Cause Prediction.
    Analyzes incident description, suggests severity (P1-P4), category, root causes, and immediate action steps.
    """
    if not ai_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini AI is not configured. Please set GEMINI_API_KEY in your .env file.",
        )
    try:
        result = await ai_service.triage_incident(
            title=data.title,
            description=data.description,
            affected_system=data.affected_system,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Triage failed: {str(e)}",
        )


@router.post("/chat", response_model=CopilotChatResponse)
async def copilot_chat_endpoint(
    data: CopilotChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Chat with the OpsPilot AI Operations Copilot.
    """
    if not ai_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini AI is not configured. Please set GEMINI_API_KEY in your .env file.",
        )
    try:
        reply = await ai_service.copilot_chat(
            message=data.message,
            tenant_name=str(current_user.organization_id),
        )
        return CopilotChatResponse(response=reply)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Copilot response failed: {str(e)}",
        )


@router.post("/decompose", response_model=TaskDecomposeResponse)
async def decompose_task_endpoint(
    data: TaskDecomposeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Decompose high-level operational goal into structured sub-tasks.
    """
    if not ai_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini AI is not configured. Please set GEMINI_API_KEY in your .env file.",
        )
    try:
        subtasks = await ai_service.decompose_task(data.goal)
        return TaskDecomposeResponse(subtasks=subtasks)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Decomposition failed: {str(e)}",
        )
