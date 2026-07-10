"""Pydantic v2 schemas used for request/response validation."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --------------------------------------------------------------------------- #
# Mixin / shared
# --------------------------------------------------------------------------- #
class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Status
# --------------------------------------------------------------------------- #
class StatusBase(BaseModel):
    name: str = Field(..., max_length=100)
    position: int = 0
    color: str = "#64748b"


class StatusCreate(StatusBase):
    pass


class StatusUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[int] = None
    color: Optional[str] = None


class StatusOut(StatusBase, ORMBase):
    id: str


# --------------------------------------------------------------------------- #
# Tag
# --------------------------------------------------------------------------- #
class TagBase(BaseModel):
    name: str = Field(..., max_length=100)
    color: str = "#3b82f6"


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TagOut(TagBase, ORMBase):
    id: str


# --------------------------------------------------------------------------- #
# Note
# --------------------------------------------------------------------------- #
class NoteBase(BaseModel):
    content: str


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    content: Optional[str] = None


class NoteOut(NoteBase, ORMBase):
    id: str
    task_id: str
    created_at: datetime
    updated_at: datetime


# --------------------------------------------------------------------------- #
# MicroTodo
# --------------------------------------------------------------------------- #
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


class MicroTodoOut(MicroTodoBase, ORMBase):
    id: str
    task_id: str
    created_at: datetime
    updated_at: datetime


# --------------------------------------------------------------------------- #
# Task
# --------------------------------------------------------------------------- #
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


class TaskOut(TaskBase, ORMBase):
    id: str
    project_id: str
    status_id: str
    position: int
    created_at: datetime
    updated_at: datetime
    tags: List[TagOut] = Field(default_factory=list)
    notes: List[NoteOut] = Field(default_factory=list)
    micro_todos: List[MicroTodoOut] = Field(default_factory=list)

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


# --------------------------------------------------------------------------- #
# Bulk move (drag-and-drop)
# --------------------------------------------------------------------------- #
class TaskMove(BaseModel):
    """Move a task to a new status and/or position."""
    status_id: Optional[str] = None
    position: Optional[int] = None
    project_id: Optional[str] = None


class TaskBulkMove(BaseModel):
    """Reorder/move multiple tasks at once (after drag-and-drop)."""
    updates: List[TaskMove] = Field(..., min_length=1)


# --------------------------------------------------------------------------- #
# Project
# --------------------------------------------------------------------------- #
class ProjectBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    color: str = "#6366f1"


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class ProjectOut(ProjectBase, ORMBase):
    id: str
    created_at: datetime
    updated_at: datetime
    task_count: int = 0


# --------------------------------------------------------------------------- #
# Webhook payloads (Git / deployment integrations)
# --------------------------------------------------------------------------- #
class WebhookGitPR(BaseModel):
    """Simplified PR-merge webhook."""
    action: str  # e.g. "closed", "merged"
    pr_title: str
    pr_number: int
    branch: Optional[str] = None
    commit_sha: Optional[str] = None
    # ProjectFlow matches tasks by tag/label name in the PR title:
    # convention: "[closes #TASK-ID]" or "[finishes PROJECT/task-title]"
    task_ids: List[str] = Field(default_factory=list)


class WebhookDeploy(BaseModel):
    """Deployment webhook. On success -> move matching tasks to 'Finished'."""
    status: str  # "success" | "failed"
    environment: str = "production"
    service: Optional[str] = None
    commit_sha: Optional[str] = None
    task_ids: List[str] = Field(default_factory=list)


class WebhookResult(BaseModel):
    received: bool = True
    updated_tasks: List[str] = Field(default_factory=list)
    message: str = ""
