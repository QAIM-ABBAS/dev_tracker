"""Tag schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class TagBase(BaseModel):
    name: str = Field(..., max_length=100)
    color: str = "#3b82f6"


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TagOut(TagBase):
    id: str

    model_config = {"from_attributes": True}
