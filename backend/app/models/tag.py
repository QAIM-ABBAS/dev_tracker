"""Tag / Label ORM model + association table."""
from __future__ import annotations

from typing import TYPE_CHECKING, List

from sqlalchemy import Column, ForeignKey, String, Table, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.task import Task


# Association table for Task <-> Tag (many-to-many)
task_tag_table = Table(
    "task_tags",
    Base.metadata,
    Column("task_id", String, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    color: Mapped[str] = mapped_column(String(20), default="#3b82f6")

    tasks: Mapped[List["Task"]] = relationship(
        secondary=task_tag_table, back_populates="tags"
    )

    __table_args__ = (UniqueConstraint("name", name="uq_tag_name"),)

    def __repr__(self) -> str:
        return f"<Tag {self.name}>"
