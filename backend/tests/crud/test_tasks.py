"""Tests for task CRUD operations."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, seed_statuses):
    """Test creating a new task."""
    # Create a project first
    project_response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"},
    )
    project_id = project_response.json()["id"]

    response = await client.post(
        "/api/v1/tasks",
        json={
            "project_id": project_id,
            "title": "Test Task",
            "description": "A test task",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Task"
    assert data["project_id"] == project_id
    assert "id" in data


@pytest.mark.asyncio
async def test_list_tasks(client: AsyncClient, seed_statuses):
    """Test listing tasks."""
    # Create a project
    project_response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"},
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

    response = await client.get(f"/api/v1/tasks?project_id={project_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


@pytest.mark.asyncio
async def test_get_task(client: AsyncClient, seed_statuses):
    """Test getting a task by ID."""
    # Create project and task
    project_response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"},
    )
    project_id = project_response.json()["id"]

    task_response = await client.post(
        "/api/v1/tasks",
        json={
            "project_id": project_id,
            "title": "Test Task",
        },
    )
    task_id = task_response.json()["id"]

    # Get the task
    response = await client.get(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Task"
    assert data["id"] == task_id


@pytest.mark.asyncio
async def test_update_task(client: AsyncClient, seed_statuses):
    """Test updating a task."""
    # Create project and task
    project_response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"},
    )
    project_id = project_response.json()["id"]

    task_response = await client.post(
        "/api/v1/tasks",
        json={
            "project_id": project_id,
            "title": "Original Title",
        },
    )
    task_id = task_response.json()["id"]

    # Update it
    response = await client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Updated Title"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"


@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient, seed_statuses):
    """Test deleting a task."""
    # Create project and task
    project_response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"},
    )
    project_id = project_response.json()["id"]

    task_response = await client.post(
        "/api/v1/tasks",
        json={
            "project_id": project_id,
            "title": "To Delete",
        },
    )
    task_id = task_response.json()["id"]

    # Delete it
    response = await client.delete(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 204

    # Verify it's gone
    response = await client.get(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_move_task(client: AsyncClient, seed_statuses):
    """Test moving a task to a different status."""
    # Get the statuses
    statuses_response = await client.get("/api/v1/statuses")
    statuses = statuses_response.json()
    status_id_1 = statuses[0]["id"]
    status_id_2 = statuses[1]["id"]

    # Create project and task
    project_response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"},
    )
    project_id = project_response.json()["id"]

    task_response = await client.post(
        "/api/v1/tasks",
        json={
            "project_id": project_id,
            "title": "Movable Task",
            "status_id": status_id_1,
        },
    )
    task_id = task_response.json()["id"]

    # Move the task
    response = await client.post(
        f"/api/v1/tasks/{task_id}/move",
        json={"status_id": status_id_2},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status_id"] == status_id_2


@pytest.mark.asyncio
async def test_add_task_note(client: AsyncClient, seed_statuses):
    """Test adding a note to a task."""
    # Create project and task
    project_response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"},
    )
    project_id = project_response.json()["id"]

    task_response = await client.post(
        "/api/v1/tasks",
        json={
            "project_id": project_id,
            "title": "Task with Note",
        },
    )
    task_id = task_response.json()["id"]

    # Add a note
    response = await client.post(
        f"/api/v1/tasks/{task_id}/notes",
        json={"content": "This is a test note"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "This is a test note"


@pytest.mark.asyncio
async def test_add_task_microtodo(client: AsyncClient, seed_statuses):
    """Test adding a microtodo to a task."""
    # Create project and task
    project_response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"},
    )
    project_id = project_response.json()["id"]

    task_response = await client.post(
        "/api/v1/tasks",
        json={
            "project_id": project_id,
            "title": "Task with MicroTodo",
        },
    )
    task_id = task_response.json()["id"]

    # Add a microtodo
    response = await client.post(
        f"/api/v1/tasks/{task_id}/microtodos",
        json={"content": "Do something"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Do something"
    assert data["completed"] is False


@pytest.mark.asyncio
async def test_task_cards(client: AsyncClient, seed_statuses):
    """Test the lightweight task cards endpoint."""
    # Create project and task
    project_response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"},
    )
    project_id = project_response.json()["id"]

    await client.post(
        "/api/v1/tasks",
        json={
            "project_id": project_id,
            "title": "Card Task",
        },
    )

    # Get cards
    response = await client.get(f"/api/v1/tasks/cards?project_id={project_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    # Cards should have micro_todo_total and micro_todo_done
    assert "micro_todo_total" in data[0]
    assert "micro_todo_done" in data[0]