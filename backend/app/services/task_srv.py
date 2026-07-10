"""Task business logic — CRUD, drag-and-drop, nested resources."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.microtodo import MicroTodo
from app.models.note import Note
from app.models.status import Status
from app.models.tag import Tag
from app.models.task import Task
from app.schemas.microtodo import MicroTodoCreate, MicroTodoOut
from app.schemas.note import NoteCreate, NoteOut
from app.schemas.tag import TagOut
from app.schemas.task import TaskCard, TaskCreate, TaskMove, TaskOut, TaskUpdate


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
async def _load_task_full(db: AsyncSession, task_id: str) -> Task:
    stmt = (
        select(Task)
        .options(
            selectinload(Task.tags),
            selectinload(Task.notes),
            selectinload(Task.micro_todos),
            selectinload(Task.status),
            selectinload(Task.project),
        )
        .where(Task.id == task_id)
    )
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return task


async def _resolve_tags(db: AsyncSession, tag_ids: List[str]) -> List[Tag]:
    if not tag_ids:
        return []
    rows = await db.execute(select(Tag).where(Tag.id.in_(tag_ids)))
    found = list(rows.scalars())
    if len(found) != len(set(tag_ids)):
        missing = set(tag_ids) - {t.id for t in found}
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown tag ids: {missing}")
    return found


async def _next_position(db: AsyncSession, project_id: str, status_id: str) -> int:
    stmt = select(func.coalesce(func.max(Task.position), -1)).where(
        Task.project_id == project_id, Task.status_id == status_id
    )
    current = (await db.execute(stmt)).scalar_one()
    return int(current) + 1


async def _default_status_id(db: AsyncSession) -> str:
    stmt = select(Status).order_by(Status.position).limit(1)
    st = (await db.execute(stmt)).scalar_one_or_none()
    if not st:
        raise HTTPException(status.HTTP_409_CONFLICT, "No statuses defined. Seed the DB first.")
    return st.id


def _to_card(task: Task) -> TaskCard:
    total = len(task.micro_todos)
    done = sum(1 for m in task.micro_todos if m.completed)
    return TaskCard(
        id=task.id,
        title=task.title,
        status_id=task.status_id,
        project_id=task.project_id,
        position=task.position,
        priority=task.priority,
        description=task.description,
        due_date=task.due_date,
        tags=[TagOut.model_validate(t) for t in task.tags],
        micro_todo_total=total,
        micro_todo_done=done,
    )


# --------------------------------------------------------------------------- #
# CRUD
# --------------------------------------------------------------------------- #
async def list_tasks(
    db: AsyncSession,
    project_id: str | None = None,
    status_id: str | None = None,
) -> list[TaskOut]:
    stmt = (
        select(Task)
        .options(
            selectinload(Task.tags),
            selectinload(Task.notes),
            selectinload(Task.micro_todos),
        )
        .order_by(Task.position)
    )
    if project_id:
        stmt = stmt.where(Task.project_id == project_id)
    if status_id:
        stmt = stmt.where(Task.status_id == status_id)
    rows = (await db.execute(stmt)).scalars().unique()
    return [TaskOut.model_validate(t) for t in rows]


async def list_task_cards(
    db: AsyncSession,
    project_id: str | None = None,
) -> list[TaskCard]:
    """Lightweight card view optimized for Kanban rendering."""
    stmt = (
        select(Task)
        .options(selectinload(Task.tags), selectinload(Task.micro_todos))
        .order_by(Task.position)
    )
    if project_id:
        stmt = stmt.where(Task.project_id == project_id)
    tasks = (await db.execute(stmt)).scalars().unique()
    return [_to_card(t) for t in tasks]


async def create_task(db: AsyncSession, payload: TaskCreate) -> TaskOut:
    if payload.status_id:
        status_id = payload.status_id
    else:
        status_id = await _default_status_id(db)

    position = payload.position
    if position is None:
        position = await _next_position(db, payload.project_id, status_id)

    task = Task(
        id=str(uuid.uuid4()),
        project_id=payload.project_id,
        status_id=status_id,
        title=payload.title,
        description=payload.description,
        position=position,
        priority=payload.priority,
        due_date=payload.due_date,
    )
    if payload.tag_ids:
        task.tags = await _resolve_tags(db, payload.tag_ids)
    db.add(task)
    await db.flush()
    task = await _load_task_full(db, task.id)
    return TaskOut.model_validate(task)


async def get_task(db: AsyncSession, task_id: str) -> TaskOut:
    task = await _load_task_full(db, task_id)
    return TaskOut.model_validate(task)


async def update_task(
    db: AsyncSession, task_id: str, payload: TaskUpdate
) -> TaskOut:
    task = await _load_task_full(db, task_id)
    data = payload.model_dump(exclude_unset=True)

    tag_ids = data.pop("tag_ids", None)
    new_status_id = data.get("status_id")
    new_project_id = data.get("project_id")

    if new_status_id and new_status_id != task.status_id and "position" not in data:
        project_id = new_project_id or task.project_id
        data["position"] = await _next_position(db, project_id, new_status_id)

    for field, value in data.items():
        setattr(task, field, value)

    if tag_ids is not None:
        task.tags = await _resolve_tags(db, tag_ids)

    await db.flush()
    task = await _load_task_full(db, task.id)
    return TaskOut.model_validate(task)


async def delete_task(db: AsyncSession, task_id: str) -> None:
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    await db.delete(task)


# --------------------------------------------------------------------------- #
# Drag-and-drop moves
# --------------------------------------------------------------------------- #
async def move_task(
    db: AsyncSession, task_id: str, payload: TaskMove
) -> TaskOut:
    task = await _load_task_full(db, task_id)

    new_status = payload.status_id or task.status_id
    new_project = payload.project_id or task.project_id

    if payload.position is None:
        position = await _next_position(db, new_project, new_status)
    else:
        position = payload.position

    task.status_id = new_status
    task.project_id = new_project
    task.position = position
    await db.flush()

    # Re-pack positions of siblings in the destination column
    siblings_stmt = (
        select(Task)
        .where(Task.project_id == new_project, Task.status_id == new_status)
        .order_by(Task.position)
    )
    siblings = list((await db.execute(siblings_stmt)).scalars())
    for i, sib in enumerate(siblings):
        sib.position = i
    await db.flush()

    task = await _load_task_full(db, task.id)
    return TaskOut.model_validate(task)


# --------------------------------------------------------------------------- #
# Nested notes
# --------------------------------------------------------------------------- #
async def add_task_note(
    db: AsyncSession, task_id: str, payload: NoteCreate
) -> NoteOut:
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    note = Note(id=str(uuid.uuid4()), task_id=task_id, content=payload.content)
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return NoteOut.model_validate(note)


# --------------------------------------------------------------------------- #
# Nested micro-todos
# --------------------------------------------------------------------------- #
async def add_task_microtodo(
    db: AsyncSession, task_id: str, payload: MicroTodoCreate
) -> MicroTodoOut:
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    stmt = (
        select(func.coalesce(func.max(MicroTodo.position), -1))
        .where(MicroTodo.task_id == task_id)
    )
    next_pos = int((await db.execute(stmt)).scalar_one()) + 1
    mt = MicroTodo(
        id=str(uuid.uuid4()),
        task_id=task_id,
        content=payload.content,
        completed=payload.completed,
        position=next_pos,
    )
    db.add(mt)
    await db.flush()
    await db.refresh(mt)
    return MicroTodoOut.model_validate(mt)
