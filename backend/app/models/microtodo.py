"""MicroTodo ORM model — nested checklist inside a task."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.common import _utcnow, _uuid_str

if TYPE_CHECKING:
    from app.models.task import Task


class MicroTodo(Base):
    __tablename__ = "micro_todos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    task_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(String(500), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    task: Mapped["Task"] = relationship(back_populates="micro_todos")

    __table_args__ = (Index("ix_microtodo_task_position", "task_id", "position"),)

    def __repr__(self) -> str:
        return f"<MicroTodo {self.content[:30]}>"
