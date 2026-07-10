"""Task schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.microtodo import MicroTodoOut
from app.schemas.note import NoteOut
from app.schemas.tag import TagOut


class TaskBase(BaseModel):
    title: str = Field(..., max_length=300)
    description: Optional[str] = None
    priority: int = Field(0, ge=0, le=3)
    due_date: Optional[datetime] = None


class TaskCreate(TaskBase):
    project_id: str
    status_id: Optional[str] = None
    position: Optional[int] = None
    tag_ids: List[str] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status_id: Optional[str] = None
    project_id: Optional[str] = None
    position: Optional[int] = None
    priority: Optional[int] = Field(None, ge=0, le=3)
    due_date: Optional[datetime] = None
    tag_ids: Optional[List[str]] = None


class TaskOut(TaskBase):
    id: str
    project_id: str
    status_id: str
    position: int
    created_at: datetime
    updated_at: datetime
    tags: List[TagOut] = Field(default_factory=list)
    notes: List[NoteOut] = Field(default_factory=list)
    micro_todos: List[MicroTodoOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}

    @property
    def micro_todo_progress(self) -> float:
        total = len(self.micro_todos)
        if total == 0:
            return 0.0
        done = sum(1 for t in self.micro_todos if t.completed)
        return done / total


class TaskCard(BaseModel):
    """Lightweight task shape for Kanban rendering."""
    id: str
    title: str
    status_id: str
    project_id: str
    position: int
    priority: int
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    tags: List[TagOut] = Field(default_factory=list)
    micro_todo_total: int = 0
    micro_todo_done: int = 0


class TaskMove(BaseModel):
    """Move a task to a new status and/or position."""
    status_id: Optional[str] = None
    position: Optional[int] = None
    project_id: Optional[str] = None


class TaskBulkMove(BaseModel):
    """Reorder/move multiple tasks at once (after drag-and-drop)."""
    updates: List[TaskMove] = Field(..., min_length=1)
