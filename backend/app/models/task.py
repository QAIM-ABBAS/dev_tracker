"""Task ORM model."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.common import _utcnow, _uuid_str
from app.models.tag import task_tag_table

if TYPE_CHECKING:
    from app.models.microtodo import MicroTodo
    from app.models.note import Note
    from app.models.project import Project
    from app.models.status import Status
    from app.models.tag import Tag


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("statuses.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0, index=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)  # 0=low,1=med,2=high,3=urgent
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    project: Mapped["Project"] = relationship(back_populates="tasks")
    status: Mapped["Status"] = relationship(back_populates="tasks")
    tags: Mapped[List["Tag"]] = relationship(
        secondary=task_tag_table, back_populates="tasks", lazy="selectin"
    )
    notes: Mapped[List["Note"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Note.created_at",
        lazy="selectin",
    )
    micro_todos: Mapped[List["MicroTodo"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="MicroTodo.position",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_task_project_status", "project_id", "status_id"),
        Index("ix_task_project_position", "project_id", "position"),
    )

    def __repr__(self) -> str:
        return f"<Task {self.title}>"
