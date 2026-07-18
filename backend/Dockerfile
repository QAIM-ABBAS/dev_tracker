# syntax=docker/dockerfile:1.6
# --------------------------------------------------------------------------- #
# ProjectFlow backend — production image                                     #
# Stage 1 compiles anything that needs build tooling (asyncpg/psycopg2, etc) #
# Stage 2 ships only the runtime, no compiler, no root user.                  #
# --------------------------------------------------------------------------- #

# ---- Stage 1: builder ----
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Build-time only deps for compiling C extensions (never shipped in runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --user -r requirements.txt

# ---- Stage 2: runtime ----
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/home/appuser/.local/bin:$PATH \
    UVICORN_WORKERS=2

WORKDIR /app

# Only the shared runtime lib for asyncpg/psycopg2 — no dev headers, no compiler
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appuser \
    && useradd -r -g appuser -d /app -s /usr/sbin/nologin appuser

COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8030

# Uses Python's stdlib instead of curl so the runtime image doesn't need to
# carry curl + its dependencies just for the healthcheck.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8030/health', timeout=3).status == 200 else 1)"

# Shell form + exec so SIGTERM from `docker stop` reaches uvicorn directly
# (not the shell), and worker count is configurable at runtime via env var.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port 8030 --workers ${UVICORN_WORKERS:-2}"]
