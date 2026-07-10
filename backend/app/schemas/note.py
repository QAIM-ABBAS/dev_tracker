"""Note schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NoteBase(BaseModel):
    content: str


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    content: Optional[str] = None


class NoteOut(NoteBase):
    id: str
    task_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
