"""
OpsPilot AI — Multi-Tenant Isolation Tests
Verifies strict logical separation across organizations (Tenant A cannot see Tenant B data).
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_tenant_data_isolation_incidents(client: AsyncClient, tenant_a: dict, tenant_b: dict):
    """Verify that Tenant B cannot access or view incidents created by Tenant A."""
    # Tenant A creates an incident
    create_payload = {
        "title": "Tenant A Confidential Infrastructure Outage",
        "description": "Database replica corruption on internal cluster",
        "severity": "P1_CRITICAL",
        "category": "DATABASE",
    }
    create_res = await client.post("/incidents", json=create_payload, headers=tenant_a["headers"])
    assert create_res.status_code == 201
    inc_a_id = create_res.json()["id"]

    # Tenant A lists incidents and sees it
    list_a = await client.get("/incidents", headers=tenant_a["headers"])
    assert list_a.status_code == 200
    items_a = list_a.json()["items"]
    assert any(i["id"] == inc_a_id for i in items_a)

    # Tenant B lists incidents and must NOT see Tenant A's incident
    list_b = await client.get("/incidents", headers=tenant_b["headers"])
    assert list_b.status_code == 200
    items_b = list_b.json()["items"]
    assert not any(i["id"] == inc_a_id for i in items_b)


@pytest.mark.asyncio
async def test_tenant_data_isolation_projects(client: AsyncClient, tenant_a: dict, tenant_b: dict):
    """Verify that projects created in Tenant A are completely hidden from Tenant B."""
    proj_payload = {
        "name": "Tenant A Secret Next-Gen Engine",
        "description": "Proprietary research initiative",
        "color": "#6366F1",
    }
    res_a = await client.post("/projects", json=proj_payload, headers=tenant_a["headers"])
    assert res_a.status_code == 201
    proj_a_id = res_a.json()["id"]

    # Tenant B lists projects -> empty or only their own
    res_b = await client.get("/projects", headers=tenant_b["headers"])
    assert res_b.status_code == 200
    b_projects = res_b.json()
    assert not any(p["id"] == proj_a_id for p in b_projects)
