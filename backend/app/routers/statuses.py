"""Statuses router — lifecycle stages (Planning, Yet to Start, In Process, Blocked, Finished)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Status
from app.schemas import StatusCreate, StatusOut, StatusUpdate

router = APIRouter(prefix="/statuses", tags=["statuses"])


@router.get("", response_model=list[StatusOut])
@router.get("/", response_model=list[StatusOut], include_in_schema=False)
async def list_statuses(db: AsyncSession = Depends(get_db)) -> list[StatusOut]:
    rows = await db.execute(select(Status).order_by(Status.position))
    return [StatusOut.model_validate(r) for r in rows.scalars()]


@router.post("", response_model=StatusOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=StatusOut, include_in_schema=False, status_code=status.HTTP_201_CREATED)
async def create_status(payload: StatusCreate, db: AsyncSession = Depends(get_db)) -> StatusOut:
    st = Status(**payload.model_dump())
    db.add(st)
    await db.flush()
    await db.refresh(st)
    return StatusOut.model_validate(st)


@router.patch("/{status_id}", response_model=StatusOut)
async def update_status(
    status_id: str, payload: StatusUpdate, db: AsyncSession = Depends(get_db)
) -> StatusOut:
    st = await db.get(Status, status_id)
    if not st:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Status not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(st, field, value)
    await db.flush()
    await db.refresh(st)
    return StatusOut.model_validate(st)


@router.delete("/{status_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_status(status_id: str, db: AsyncSession = Depends(get_db)) -> Response:
    st = await db.get(Status, status_id)
    if not st:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Status not found")
    if st.tasks:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Cannot delete a status that still has tasks attached. Reassign them first.",
        )
    await db.delete(st)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
