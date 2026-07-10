"""Micro-todos endpoint — nested checklists inside tasks."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.microtodo import MicroTodo
from app.schemas.microtodo import MicroTodoCreate, MicroTodoOut, MicroTodoUpdate

router = APIRouter(prefix="/microtodos", tags=["microtodos"])


@router.get("", response_model=list[MicroTodoOut])
@router.get("/", response_model=list[MicroTodoOut], include_in_schema=False)
async def list_microtodos(
    task_id: str | None = None, db: AsyncSession = Depends(get_db)
) -> list[MicroTodoOut]:
    stmt = select(MicroTodo).order_by(MicroTodo.position)
    if task_id:
        stmt = stmt.where(MicroTodo.task_id == task_id)
    rows = await db.execute(stmt)
    return [MicroTodoOut.model_validate(r) for r in rows.scalars()]


@router.patch("/{microtodo_id}", response_model=MicroTodoOut)
async def update_microtodo(
    microtodo_id: str, payload: MicroTodoUpdate, db: AsyncSession = Depends(get_db)
) -> MicroTodoOut:
    mt = await db.get(MicroTodo, microtodo_id)
    if not mt:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Micro-todo not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(mt, field, value)
    await db.flush()
    await db.refresh(mt)
    return MicroTodoOut.model_validate(mt)


@router.delete("/{microtodo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_microtodo(microtodo_id: str, db: AsyncSession = Depends(get_db)) -> Response:
    mt = await db.get(MicroTodo, microtodo_id)
    if not mt:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Micro-todo not found")
    await db.delete(mt)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
