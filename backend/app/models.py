"""SQLAlchemy ORM models for ProjectFlow.

Relationships:
- Project 1:N Task
- Task 1:N Note
- Task 1:N MicroTodo
- Task N:N Tag  (via TaskTag)
- Status 1:N Task
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid_str() -> str:
    return str(uuid.uuid4())


# --------------------------------------------------------------------------- #
# Association table for Task <-> Tag (many-to-many)
# --------------------------------------------------------------------------- #
task_tag_table = Table(
    "task_tags",
    Base.metadata,
    Column("task_id", String, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


# --------------------------------------------------------------------------- #
# Project
# --------------------------------------------------------------------------- #
class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(String(20), default="#6366f1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    tasks: Mapped[List["Task"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="Task.position",
    )

    def __repr__(self) -> str:
        return f"<Project {self.name}>"


# --------------------------------------------------------------------------- #
# Status (lifecycle stages)
# --------------------------------------------------------------------------- #
class Status(Base):
    __tablename__ = "statuses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, index=True)
    color: Mapped[str] = mapped_column(String(20), default="#64748b")

    tasks: Mapped[List["Task"]] = relationship(back_populates="status")

    def __repr__(self) -> str:
        return f"<Status {self.name}>"


# --------------------------------------------------------------------------- #
# Tag / Label
# --------------------------------------------------------------------------- #
class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    color: Mapped[str] = mapped_column(String(20), default="#3b82f6")

    tasks: Mapped[List["Task"]] = relationship(
        secondary=task_tag_table, back_populates="tags"
    )

    __table_args__ = (UniqueConstraint("name", name="uq_tag_name"),)

    def __repr__(self) -> str:
        return f"<Tag {self.name}>"


# --------------------------------------------------------------------------- #
# Task
# --------------------------------------------------------------------------- #
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


# --------------------------------------------------------------------------- #
# Note (freeform markdown commentary on a task)
# --------------------------------------------------------------------------- #
class Note(Base):
    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    task_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    task: Mapped["Task"] = relationship(back_populates="notes")

    def __repr__(self) -> str:
        return f"<Note {self.id[:8]}>"


# --------------------------------------------------------------------------- #
# MicroTodo (nested checklist inside a task)
# --------------------------------------------------------------------------- #
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
