"""Tasks endpoint — thin router delegating to task_srv."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.microtodo import MicroTodoCreate, MicroTodoOut
from app.schemas.note import NoteCreate, NoteOut
from app.schemas.task import TaskCard, TaskCreate, TaskMove, TaskOut, TaskUpdate
from app.services import task_srv

router = APIRouter(prefix="/tasks", tags=["tasks"])


# --------------------------------------------------------------------------- #
# CRUD
# --------------------------------------------------------------------------- #
@router.get("", response_model=list[TaskOut])
@router.get("/", response_model=list[TaskOut], include_in_schema=False)
async def list_tasks(
    project_id: str | None = Query(None),
    status_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> list[TaskOut]:
    return await task_srv.list_tasks(db, project_id, status_id)


@router.get("/cards", response_model=list[TaskCard], tags=["tasks"])
async def list_task_cards(
    project_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> list[TaskCard]:
    """Lightweight card view optimized for Kanban rendering."""
    return await task_srv.list_task_cards(db, project_id)


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=TaskOut, include_in_schema=False, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, db: AsyncSession = Depends(get_db)) -> TaskOut:
    return await task_srv.create_task(db, payload)


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)) -> TaskOut:
    return await task_srv.get_task(db, task_id)


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str, payload: TaskUpdate, db: AsyncSession = Depends(get_db)
) -> TaskOut:
    return await task_srv.update_task(db, task_id, payload)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str, db: AsyncSession = Depends(get_db)) -> Response:
    await task_srv.delete_task(db, task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- #
# Drag-and-drop moves
# --------------------------------------------------------------------------- #
@router.post("/{task_id}/move", response_model=TaskOut)
async def move_task(
    task_id: str, payload: TaskMove, db: AsyncSession = Depends(get_db)
) -> TaskOut:
    return await task_srv.move_task(db, task_id, payload)


# --------------------------------------------------------------------------- #
# Nested notes
# --------------------------------------------------------------------------- #
@router.post("/{task_id}/notes", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
async def add_task_note(
    task_id: str, payload: NoteCreate, db: AsyncSession = Depends(get_db)
) -> NoteOut:
    return await task_srv.add_task_note(db, task_id, payload)


# --------------------------------------------------------------------------- #
# Nested micro-todos
# --------------------------------------------------------------------------- #
@router.post(
    "/{task_id}/microtodos",
    response_model=MicroTodoOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_task_microtodo(
    task_id: str, payload: MicroTodoCreate, db: AsyncSession = Depends(get_db)
) -> MicroTodoOut:
    return await task_srv.add_task_microtodo(db, task_id, payload)
