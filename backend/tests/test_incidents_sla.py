"""
OpsPilot AI — Incident & SLA Engine Tests
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_incident_computes_sla(client: AsyncClient, tenant_a: dict):
    """Verify that creating an incident generates incident numbers and SLA deadlines."""
    payload = {
        "title": "Ingress Controller High Latency 502 Spikes",
        "description": "NGINX ingress upstream connections timing out under surge.",
        "severity": "P1_CRITICAL",
        "category": "INFRASTRUCTURE",
    }
    response = await client.post("/incidents", json=payload, headers=tenant_a["headers"])
    assert response.status_code == 201
    data = response.json()
    assert "incident_number" in data
    assert data["incident_number"].startswith("INC-")
    assert data["severity"] == "P1_CRITICAL"
    assert data["sla_response_due"] is not None
    assert data["sla_resolution_due"] is not None


@pytest.mark.asyncio
async def test_resolve_incident_updates_status(client: AsyncClient, tenant_a: dict):
    """Verify updating incident status to RESOLVED."""
    create_payload = {
        "title": "Payment Webhook Endpoint Retry Storm",
        "description": "Third-party payment provider duplicate events.",
        "severity": "P2_HIGH",
        "category": "PAYMENTS",
    }
    create_res = await client.post("/incidents", json=create_payload, headers=tenant_a["headers"])
    inc_id = create_res.json()["id"]

    update_payload = {
        "status": "RESOLVED",
        "resolution_notes": "Implemented deduplication cache key in Redis.",
    }
    update_res = await client.patch(f"/incidents/{inc_id}", json=update_payload, headers=tenant_a["headers"])
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "RESOLVED"
