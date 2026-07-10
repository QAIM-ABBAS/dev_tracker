"""Tags router — many-to-many labels."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Tag
from app.schemas import TagCreate, TagOut, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagOut])
@router.get("/", response_model=list[TagOut], include_in_schema=False)
async def list_tags(db: AsyncSession = Depends(get_db)) -> list[TagOut]:
    rows = await db.execute(select(Tag).order_by(Tag.name))
    return [TagOut.model_validate(r) for r in rows.scalars()]


@router.post("", response_model=TagOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=TagOut, include_in_schema=False, status_code=status.HTTP_201_CREATED)
async def create_tag(payload: TagCreate, db: AsyncSession = Depends(get_db)) -> TagOut:
    tag = Tag(**payload.model_dump())
    db.add(tag)
    try:
        await db.flush()
    except Exception:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Tag with that name already exists")
    await db.refresh(tag)
    return TagOut.model_validate(tag)


@router.patch("/{tag_id}", response_model=TagOut)
async def update_tag(
    tag_id: str, payload: TagUpdate, db: AsyncSession = Depends(get_db)
) -> TagOut:
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tag not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tag, field, value)
    await db.flush()
    await db.refresh(tag)
    return TagOut.model_validate(tag)


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(tag_id: str, db: AsyncSession = Depends(get_db)) -> Response:
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tag not found")
    await db.delete(tag)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
