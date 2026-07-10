"""Routers package — register all sub-routers."""
from . import microtodos, notes, projects, statuses, tags, tasks, webhooks

__all__ = [
    "microtodos",
    "notes",
    "projects",
    "statuses",
    "tags",
    "tasks",
    "webhooks",
]
