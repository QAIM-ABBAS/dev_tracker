"""Status (lifecycle stage) ORM model."""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.task import Task


class Status(Base):
    __tablename__ = "statuses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, index=True)
    color: Mapped[str] = mapped_column(String(20), default="#64748b")

    tasks: Mapped[List["Task"]] = relationship(back_populates="status")

    def __repr__(self) -> str:
        return f"<Status {self.name}>"
