"""Async SQLAlchemy database engine + session factory."""
from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


engine = create_async_engine(
    settings.sqlalchemy_database_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables. Called on startup (dev convenience)."""
    from app import models  # noqa: F401 - register models with metadata

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default statuses if the table is empty
    await seed_default_statuses()


async def seed_default_statuses() -> None:
    """Insert the canonical lifecycle statuses on first boot."""
    from sqlalchemy import select

    from app.models.status import Status

    default_statuses = [
        ("Todo", 0, "#64748b"),
        ("In Process", 1, "#0ea5e9"),
        ("Finished", 2, "#22c55e"),
        ("Test", 3, "#f59e0b"),
        ("Closed", 4, "#ef4444"),
    ]

    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(Status))
        if existing.scalars().first() is not None:
            return

        for name, position, color in default_statuses:
            session.add(Status(name=name, position=position, color=color))
        await session.commit()
