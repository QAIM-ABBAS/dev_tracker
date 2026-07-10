"""MicroTodo schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MicroTodoBase(BaseModel):
    content: str = Field(..., max_length=500)
    completed: bool = False
    position: int = 0


class MicroTodoCreate(MicroTodoBase):
    task_id: Optional[str] = None


class MicroTodoUpdate(BaseModel):
    content: Optional[str] = None
    completed: Optional[bool] = None
    position: Optional[int] = None


class MicroTodoOut(MicroTodoBase):
    id: str
    task_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
