"""V1 API router — aggregates all endpoint routers."""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    microtodos,
    notes,
    projects,
    statuses,
    tags,
    tasks,
    users,
    webhooks,
)

api_router = APIRouter()

api_router.include_router(projects.router)
api_router.include_router(statuses.router)
api_router.include_router(tags.router)
api_router.include_router(tasks.router)
api_router.include_router(notes.router)
api_router.include_router(microtodos.router)
api_router.include_router(users.router)
api_router.include_router(webhooks.router)
