"""Webhook schemas (Git / deployment integrations)."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class WebhookGitPR(BaseModel):
    """Simplified PR-merge webhook."""
    action: str  # e.g. "closed", "merged"
    pr_title: str
    pr_number: int
    branch: Optional[str] = None
    commit_sha: Optional[str] = None
    task_ids: List[str] = Field(default_factory=list)


class WebhookDeploy(BaseModel):
    """Deployment webhook. On success -> move matching tasks to 'Finished'."""
    status: str  # "success" | "failed"
    environment: str = "production"
    service: Optional[str] = None
    commit_sha: Optional[str] = None
    task_ids: List[str] = Field(default_factory=list)


class WebhookResult(BaseModel):
    received: bool = True
    updated_tasks: List[str] = Field(default_factory=list)
    message: str = ""
