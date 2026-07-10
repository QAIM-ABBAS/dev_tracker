"""Status schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


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


class StatusOut(StatusBase):
    id: str

    model_config = {"from_attributes": True}
