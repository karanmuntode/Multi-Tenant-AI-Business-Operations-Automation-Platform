"""
OpsPilot AI — Authentication & RBAC Tests
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_new_tenant(client: AsyncClient):
    """Test organization registration and admin user provisioning."""
    payload = {
        "org_name": "Initech Corp",
        "org_slug": "initech-corp",
        "industry": "FinTech",
        "first_name": "Peter",
        "last_name": "Gibbons",
        "email": "peter@initech.com",
        "password": "Password123!",
    }
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "peter@initech.com"


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, tenant_a: dict):
    """Test user login with valid credentials returns JWT tokens."""
    payload = {
        "email": "admin@acme.com",
        "password": "Password123!",
    }
    response = await client.post("/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, tenant_a: dict):
    """Test login rejection when password does not match."""
    payload = {
        "email": "admin@acme.com",
        "password": "WrongPassword!",
    }
    response = await client.post("/auth/login", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_me(client: AsyncClient, tenant_a: dict):
    """Test retrieving authenticated user profile."""
    response = await client.get("/auth/me", headers=tenant_a["headers"])
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@acme.com"
    assert data["role"] == "org_admin"
