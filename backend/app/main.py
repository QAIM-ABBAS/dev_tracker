"""ProjectFlow FastAPI entry point.

Run locally:  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Swagger UI:   http://localhost:8000/docs
ReDoc:        http://localhost:8000/redoc
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("projectflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup + shutdown lifecycle."""
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    await init_db()
    logger.info("Database initialised and default statuses seeded.")
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "A hyper-fast, minimalist, developer-centric project tracking API. "
        "100% of frontend actions map directly to the endpoints documented below. "
        "Drag-and-drop moves use POST /api/v1/tasks/{id}/move. "
        "Git & deploy webhooks live under /api/v1/webhooks."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["meta"])
async def root() -> dict:
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
        "api": settings.API_V1_PREFIX,
    }


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {"status": "ok"}


# Register V1 API router
from app.api.v1.router import api_router  # noqa: E402

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
