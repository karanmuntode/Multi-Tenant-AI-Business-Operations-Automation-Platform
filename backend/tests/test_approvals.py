"""
OpsPilot AI — Human-in-the-Loop Approvals Tests
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_approve_request(client: AsyncClient, tenant_a: dict):
    """Test approval creation and transition to APPROVED."""
    create_payload = {
        "requested_by_agent": "Communication Agent",
        "action_type": "SEND_EMAIL",
        "risk_level": "HIGH",
        "title": "Send Outage Notification Email",
        "description": "Stakeholder email notification for database latency.",
        "payload": {"recipient": "users@acme.com", "subject": "Notice"},
    }
    create_res = await client.post("/approvals", json=create_payload, headers=tenant_a["headers"])
    assert create_res.status_code == 201
    appr_id = create_res.json()["id"]
    assert create_res.json()["status"] == "PENDING"

    # Approve action
    appr_res = await client.post(f"/approvals/{appr_id}/approve", headers=tenant_a["headers"])
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "APPROVED"


@pytest.mark.asyncio
async def test_reject_request(client: AsyncClient, tenant_a: dict):
    """Test approval request rejection with reason."""
    create_payload = {
        "requested_by_agent": "Data Agent",
        "action_type": "MODIFY_DATABASE",
        "risk_level": "HIGH",
        "title": "Drop Unused Partition Table",
        "description": "Automated disk reclamation query.",
        "payload": {"query": "DROP TABLE legacy_logs_2024"},
    }
    create_res = await client.post("/approvals", json=create_payload, headers=tenant_a["headers"])
    appr_id = create_res.json()["id"]

    reject_res = await client.post(
        f"/approvals/{appr_id}/reject",
        json={"reason": "Requires review by DBA team during maintenance window."},
        headers=tenant_a["headers"],
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"
