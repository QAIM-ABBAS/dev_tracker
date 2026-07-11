"""Project schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    color: str = "#6366f1"
    status: str = "Planning"


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    status: Optional[str] = None


class ProjectOut(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime
    task_count: int = 0

    model_config = {"from_attributes": True}
