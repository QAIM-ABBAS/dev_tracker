"""Tests for /api/v1/users endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration."""
    response = await client.post(
        "/api/v1/users/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert data["is_active"] is True
    assert "id" in data


@pytest.mark.asyncio
async def test_register_user_duplicate_email(client: AsyncClient):
    """Test registration with duplicate email fails."""
    await client.post(
        "/api/v1/users/register",
        json={
            "email": "test@example.com",
            "username": "user1",
            "password": "securepassword123",
        },
    )
    response = await client.post(
        "/api/v1/users/register",
        json={
            "email": "test@example.com",
            "username": "user2",
            "password": "securepassword123",
        },
    )
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_user_duplicate_username(client: AsyncClient):
    """Test registration with duplicate username fails."""
    await client.post(
        "/api/v1/users/register",
        json={
            "email": "user1@example.com",
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    response = await client.post(
        "/api/v1/users/register",
        json={
            "email": "user2@example.com",
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    assert response.status_code == 400
    assert "Username already taken" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    """Test user login returns JWT token."""
    # Register first
    await client.post(
        "/api/v1/users/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "securepassword123",
        },
    )

    # Login
    response = await client.post(
        "/api/v1/users/login",
        json={
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_user_invalid_credentials(client: AsyncClient):
    """Test login with wrong password fails."""
    await client.post(
        "/api/v1/users/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "securepassword123",
        },
    )

    response = await client.post(
        "/api/v1/users/login",
        json={
            "username": "testuser",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient):
    """Test getting current user profile."""
    # Register and login
    await client.post(
        "/api/v1/users/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    login_response = await client.post(
        "/api/v1/users/login",
        json={
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    token = login_response.json()["access_token"]

    # Get me
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    """Test getting profile without token fails."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_users(client: AsyncClient):
    """Test listing users requires authentication."""
    response = await client.get("/api/v1/users")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_users_authenticated(client: AsyncClient):
    """Test listing users when authenticated."""
    # Register and login
    await client.post(
        "/api/v1/users/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    login_response = await client.post(
        "/api/v1/users/login",
        json={
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    token = login_response.json()["access_token"]

    # List users
    response = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_update_user(client: AsyncClient):
    """Test updating user profile."""
    # Register and login
    register_response = await client.post(
        "/api/v1/users/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    user_id = register_response.json()["id"]

    login_response = await client.post(
        "/api/v1/users/login",
        json={
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    token = login_response.json()["access_token"]

    # Update user
    response = await client.patch(
        f"/api/v1/users/{user_id}",
        json={"username": "updateduser"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "updateduser"


@pytest.mark.asyncio
async def test_delete_user(client: AsyncClient):
    """Test deleting user account."""
    # Register and login
    register_response = await client.post(
        "/api/v1/users/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    user_id = register_response.json()["id"]

    login_response = await client.post(
        "/api/v1/users/login",
        json={
            "username": "testuser",
            "password": "securepassword123",
        },
    )
    token = login_response.json()["access_token"]

    # Delete user
    response = await client.delete(
        f"/api/v1/users/{user_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 204

    # Verify user is deleted - token is now invalid since user no longer exists
    response = await client.get(
        f"/api/v1/users/{user_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401