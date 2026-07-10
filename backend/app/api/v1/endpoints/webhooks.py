"""Webhooks endpoint — Git PR + deployment integrations."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import verify_webhook_secret
from app.db.session import get_db
from app.models.status import Status
from app.models.task import Task
from app.schemas.webhook import WebhookDeploy, WebhookGitPR, WebhookResult

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


async def _status_by_name(db: AsyncSession, name_contains: str) -> Status:
    """Find a status whose name contains the given substring (case-insensitive)."""
    stmt = select(Status).where(Status.name.ilike(f"%{name_contains}%"))
    st = (await db.execute(stmt)).scalars().first()
    if not st:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"No status matching '{name_contains}'. Seed the default lifecycle.",
        )
    return st


async def _apply_status_to_tasks(
    db: AsyncSession, task_ids: List[str], target: Status
) -> List[str]:
    if not task_ids:
        return []
    rows = await db.execute(select(Task).where(Task.id.in_(task_ids)))
    tasks = list(rows.scalars())
    updated: list[str] = []
    for t in tasks:
        t.status_id = target.id
        updated.append(t.id)
    await db.flush()
    return updated


@router.post("/git", response_model=WebhookResult, dependencies=[Depends(verify_webhook_secret)])
async def git_webhook(payload: WebhookGitPR, db: AsyncSession = Depends(get_db)) -> WebhookResult:
    """Handle a PR event. `merged` action => 'Finished', others => 'In Process'."""
    if not payload.task_ids:
        return WebhookResult(received=True, message="No task_ids supplied; nothing to update.")

    action = (payload.action or "").lower()
    if action == "merged":
        target = await _status_by_name(db, "Finished")
    else:
        target = await _status_by_name(db, "In Process")

    updated = await _apply_status_to_tasks(db, payload.task_ids, target)
    return WebhookResult(
        updated_tasks=updated,
        message=f"Moved {len(updated)} task(s) to '{target.name}'.",
    )


@router.post(
    "/deploy",
    response_model=WebhookResult,
    dependencies=[Depends(verify_webhook_secret)],
)
async def deploy_webhook(
    payload: WebhookDeploy, db: AsyncSession = Depends(get_db)
) -> WebhookResult:
    """Handle a deployment event."""
    if not payload.task_ids:
        return WebhookResult(received=True, message="No task_ids supplied; nothing to update.")

    if payload.status.lower() == "success":
        target = await _status_by_name(db, "Finished")
    else:
        target = await _status_by_name(db, "Blocked")

    updated = await _apply_status_to_tasks(db, payload.task_ids, target)
    return WebhookResult(
        updated_tasks=updated,
        message=f"Moved {len(updated)} task(s) to '{target.name}'.",
    )
