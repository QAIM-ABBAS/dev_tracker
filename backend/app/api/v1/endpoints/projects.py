"""Projects endpoint — thin router delegating to project_srv."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.project import ProjectCreate, ProjectOut, ProjectReorder, ProjectUpdate
from app.services import project_srv

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
@router.get("/", response_model=list[ProjectOut], include_in_schema=False)
async def list_projects(db: AsyncSession = Depends(get_db)) -> list[ProjectOut]:
    return await project_srv.list_projects(db)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProjectOut, include_in_schema=False, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, db: AsyncSession = Depends(get_db)) -> ProjectOut:
    return await project_srv.create_project(db, payload)


@router.post("/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_projects(payload: ProjectReorder, db: AsyncSession = Depends(get_db)) -> Response:
    await project_srv.reorder_projects(db, payload.ordered_ids)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)) -> ProjectOut:
    return await project_srv.get_project(db, project_id)


@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: str, payload: ProjectUpdate, db: AsyncSession = Depends(get_db)
) -> ProjectOut:
    return await project_srv.update_project(db, project_id, payload)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)) -> Response:
    await project_srv.delete_project(db, project_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
