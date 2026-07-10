"""Notes endpoint — markdown commentary on tasks."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteOut])
@router.get("/", response_model=list[NoteOut], include_in_schema=False)
async def list_notes(task_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[NoteOut]:
    stmt = select(Note).order_by(Note.created_at.desc())
    if task_id:
        stmt = stmt.where(Note.task_id == task_id)
    rows = await db.execute(stmt)
    return [NoteOut.model_validate(r) for r in rows.scalars()]


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=NoteOut, include_in_schema=False, status_code=status.HTTP_201_CREATED)
async def create_note(payload: NoteCreate, db: AsyncSession = Depends(get_db)) -> NoteOut:
    raise HTTPException(
        status.HTTP_400_BAD_REQUEST,
        "Use POST /api/v1/tasks/{task_id}/notes to attach a note to a task.",
    )


@router.patch("/{note_id}", response_model=NoteOut)
async def update_note(
    note_id: str, payload: NoteUpdate, db: AsyncSession = Depends(get_db)
) -> NoteOut:
    note = await db.get(Note, note_id)
    if not note:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Note not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    await db.flush()
    await db.refresh(note)
    return NoteOut.model_validate(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: str, db: AsyncSession = Depends(get_db)) -> Response:
    note = await db.get(Note, note_id)
    if not note:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Note not found")
    await db.delete(note)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/by-task/{task_id}",
    response_model=list[NoteOut],
    tags=["tasks"],
)
async def list_task_notes(task_id: str, db: AsyncSession = Depends(get_db)) -> list[NoteOut]:
    rows = await db.execute(
        select(Note).where(Note.task_id == task_id).order_by(Note.created_at)
    )
    return [NoteOut.model_validate(r) for r in rows.scalars()]
