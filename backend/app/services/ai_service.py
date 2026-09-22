"""
OpsPilot AI — Gemini AI Operations Intelligence Service
Provides automated incident triage, root cause analysis, operational copilot, and smart task decomposition.
"""

import json
import logging
from typing import Any, Dict, List, Optional
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class GeminiAIService:
    """Service wrapper for Google Gemini AI Operations features."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL or "gemini-2.5-flash"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    def is_configured(self) -> bool:
        """Check if a valid Gemini API key is configured."""
        return bool(self.api_key and self.api_key != "your-gemini-api-key-here" and len(self.api_key) > 10)

    async def _generate_content(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Send prompt to Gemini API with async HTTPX client."""
        if not self.is_configured():
            raise ValueError("Gemini API key is not configured in .env")

        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        
        contents = []
        if system_instruction:
            contents.append({"role": "user", "parts": [{"text": f"System Context: {system_instruction}"}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will follow these instructions and return the requested response format."}]})
        
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.95,
                "maxOutputTokens": 2048,
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                logger.error(f"Gemini API Error {response.status_code}: {response.text}")
                raise RuntimeError(f"Gemini API Error: {response.text}")
            
            data = response.json()
            try:
                text_response = data["candidates"][0]["content"]["parts"][0]["text"]
                return text_response
            except (KeyError, IndexError) as e:
                logger.error(f"Failed to parse Gemini response: {data}")
                raise RuntimeError(f"Invalid response structure from Gemini: {e}")

    async def triage_incident(self, title: str, description: str, affected_system: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze an operational incident using Gemini AI.
        Returns severity rating (P1-P4), confidence score, root cause hypothesis, and actionable remediation steps.
        """
        system_instruction = (
            "You are OpsPilot AI, an elite Site Reliability Engineering (SRE) and Business Operations AI Specialist. "
            "Analyze the given incident and return a valid JSON object strictly matching this schema: "
            "{\n"
            '  "suggested_severity": "P1_CRITICAL" | "P2_HIGH" | "P3_MEDIUM" | "P4_LOW",\n'
            '  "confidence_score": 0.95,\n'
            '  "category": "INFRASTRUCTURE" | "SECURITY" | "DATABASE" | "PAYMENTS" | "APPLICATION" | "NETWORK",\n'
            '  "root_cause_analysis": "Brief 1-2 sentence probable root cause",\n'
            '  "immediate_mitigation_steps": ["Step 1", "Step 2", "Step 3"],\n'
            '  "recommended_runbook": "Suggested runbook name or procedure",\n'
            '  "estimated_resolution_minutes": 45\n'
            "}"
        )

        prompt = f"""
Analyze the following operational incident:
Title: {title}
Description: {description}
Affected System/Component: {affected_system or 'Unknown'}

Return ONLY raw JSON, with no markdown code fences or conversational text.
"""
        raw_text = await self._generate_content(prompt, system_instruction)
        clean_text = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            return {
                "suggested_severity": "P2_HIGH",
                "confidence_score": 0.80,
                "category": "APPLICATION",
                "root_cause_analysis": raw_text[:200],
                "immediate_mitigation_steps": ["Inspect application logs", "Check health probes", "Notify on-call engineer"],
                "recommended_runbook": "Standard Incident Response",
                "estimated_resolution_minutes": 60,
            }

    async def copilot_chat(self, message: str, context_history: Optional[List[Dict[str, str]]] = None, tenant_name: str = "Enterprise") -> str:
        """
        Chat with OpsPilot Operational Intelligence Copilot.
        """
        system_instruction = (
            f"You are OpsPilot Copilot, an AI Business Operations Assistant for {tenant_name}. "
            "You assist operations managers, IT teams, and executives with incident triage, workflow automation, "
            "SLA management, team workloads, and operational optimization. Be concise, professional, data-driven, and actionable."
        )

        prompt = f"User Request: {message}"
        return await self._generate_content(prompt, system_instruction)

    async def decompose_task(self, goal: str) -> List[Dict[str, Any]]:
        """
        Break down a large project milestone or operational objective into actionable sub-tasks.
        """
        system_instruction = (
            "You are an agile project operations manager. Break down the provided goal into 3-6 actionable sub-tasks. "
            "Return ONLY a JSON array of objects strictly matching this format:\n"
            "[\n"
            '  {"title": "Task title", "priority": "HIGH"|"MEDIUM"|"LOW", "estimated_hours": 4, "description": "Short description"}\n'
            "]"
        )

        prompt = f"Goal to decompose: {goal}\nReturn ONLY the JSON array without markdown formatting."
        raw_text = await self._generate_content(prompt, system_instruction)
        clean_text = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            return [
                {"title": "Initial assessment & planning", "priority": "HIGH", "estimated_hours": 2, "description": goal},
                {"title": "Implementation & testing", "priority": "MEDIUM", "estimated_hours": 6, "description": "Execute core requirements"},
                {"title": "Review & verification", "priority": "LOW", "estimated_hours": 2, "description": "Validate completion and metrics"},
            ]


# Singleton instance
ai_service = GeminiAIService()
