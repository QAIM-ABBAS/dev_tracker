"""Tests for project CRUD operations."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_project(client: AsyncClient):
    """Test creating a new project."""
    response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project", "description": "A test project"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["description"] == "A test project"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_projects(client: AsyncClient):
    """Test listing projects."""
    # Create a project first
    await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"},
    )

    response = await client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_get_project(client: AsyncClient):
    """Test getting a project by ID."""
    # Create a project
    create_response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"},
    )
    project_id = create_response.json()["id"]

    # Get the project
    response = await client.get(f"/api/v1/projects/{project_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["id"] == project_id


@pytest.mark.asyncio
async def test_get_project_not_found(client: AsyncClient):
    """Test getting a non-existent project returns 404."""
    response = await client.get("/api/v1/projects/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_project(client: AsyncClient):
    """Test updating a project."""
    # Create a project
    create_response = await client.post(
        "/api/v1/projects",
        json={"name": "Original Name"},
    )
    project_id = create_response.json()["id"]

    # Update it
    response = await client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Updated Name"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_delete_project(client: AsyncClient):
    """Test deleting a project."""
    # Create a project
    create_response = await client.post(
        "/api/v1/projects",
        json={"name": "To Delete"},
    )
    project_id = create_response.json()["id"]

    # Delete it
    response = await client.delete(f"/api/v1/projects/{project_id}")
    assert response.status_code == 204

    # Verify it's gone
    response = await client.get(f"/api/v1/projects/{project_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_project_task_count(client: AsyncClient, seed_statuses):
    """Test that project task_count is accurate."""
    # Create a project
    project_response = await client.post(
        "/api/v1/projects",
        json={"name": "Count Test"},
    )
    project_id = project_response.json()["id"]

    # Create tasks
    for i in range(3):
        await client.post(
            "/api/v1/tasks",
            json={
                "project_id": project_id,
                "title": f"Task {i}",
            },
        )

    # Get project and check count
    response = await client.get(f"/api/v1/projects/{project_id}")
    assert response.status_code == 200
    assert response.json()["task_count"] == 3