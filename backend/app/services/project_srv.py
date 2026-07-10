"""Project business logic — CRUD operations."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.task import Task
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate


async def list_projects(db: AsyncSession) -> list[ProjectOut]:
    """Return all projects ordered by creation time, with task counts."""
    stmt = (
        select(
            Project,
            func.count(Task.id).label("task_count"),
        )
        .outerjoin(Task, Task.project_id == Project.id)
        .group_by(Project.id)
        .order_by(Project.created_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    out: list[ProjectOut] = []
    for proj, cnt in rows:
        out.append(ProjectOut.model_validate(proj).model_copy(update={"task_count": cnt or 0}))
    return out


async def create_project(db: AsyncSession, payload: ProjectCreate) -> ProjectOut:
    project = Project(**payload.model_dump())
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return ProjectOut.model_validate(project).model_copy(update={"task_count": 0})


async def get_project(db: AsyncSession, project_id: str) -> ProjectOut:
    stmt = (
        select(Project, func.count(Task.id).label("task_count"))
        .outerjoin(Task, Task.project_id == Project.id)
        .where(Project.id == project_id)
        .group_by(Project.id)
    )
    row = (await db.execute(stmt)).first()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    proj, cnt = row
    return ProjectOut.model_validate(proj).model_copy(update={"task_count": cnt or 0})


async def update_project(
    db: AsyncSession, project_id: str, payload: ProjectUpdate
) -> ProjectOut:
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.flush()
    await db.refresh(project)
    return ProjectOut.model_validate(project)


async def delete_project(db: AsyncSession, project_id: str) -> None:
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    await db.delete(project)
