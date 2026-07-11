# ProjectFlow

A hyper-fast, minimalist, developer-centric project tracking application. Built with **FastAPI + React (Vite) + TypeScript**, containerised with Docker, and ready to self-host behind any reverse proxy.

> Non-negotiable stack: **FastAPI (Python) + React + TypeScript (Vite)**. No Next.js, no SSR framework swap.

---

## Features

- **Keyboard-first Kanban board** — drag-and-drop between 5 lifecycle columns: `Planning / Backlog`, `Yet to Start`, `In Process`, `Blocked`, `Finished`.
- **Optimistic UI** — every mutation applies instantly to the local cache and rolls back on error. Powered by TanStack Query.
- **Cmd+K command palette** — create tasks, switch projects, jump to any status from anywhere.
- **Inline editing** — click any task title to edit it in place. Descriptions support full Markdown with syntax-highlighted code blocks.
- **Micro-todos** — nested checklists inside each task; the parent card shows a live progress bar.
- **Quick-add on hover** — each column exposes a `+` button to add a task without leaving the board.
- **Quick status select** — hover a card and pick a new status from the dropdown, no drag required.
- **API-first** — 100% of UI actions map to a public RESTful endpoint. Auto-generated Swagger at `/docs`.
- **Git & deploy webhooks** — POST to `/api/v1/webhooks/git` or `/api/v1/webhooks/deploy` to advance task statuses from CI/CD.
- **User authentication** — JWT-based auth with registration, login, and protected endpoints.

---

## Project structure

```
.
├── backend/                      # FastAPI application
│   ├── app/
│   │   ├── main.py               # App entry + lifespan (auto-creates tables & seeds)
│   │   ├── core/
│   │   │   ├── config.py         # Pydantic BaseSettings (env vars)
│   │   │   └── security.py       # JWT auth, password hashing, webhook verification
│   │   ├── db/
│   │   │   └── session.py        # SQLAlchemy async engine + session factory
│   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── base.py           # Declarative base
│   │   │   ├── project.py
│   │   │   ├── task.py
│   │   │   ├── user.py           # User model for authentication
│   │   │   └── ...
│   │   ├── schemas/              # Pydantic v2 request/response schemas
│   │   ├── services/             # Business logic (CRUD operations)
│   │   │   ├── project_srv.py
│   │   │   ├── task_srv.py
│   │   │   └── user_srv.py       # User auth + CRUD
│   │   └── api/v1/endpoints/     # API routers
│   │       ├── projects.py
│   │       ├── tasks.py
│   │       ├── users.py          # Registration, login, profile
│   │       └── ...
│   ├── tests/                    # Pytest tests
│   │   ├── api/
│   │   └── crud/
│   ├── alembic/                  # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                     # React (Vite) + TypeScript + Tailwind
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api/client.ts         # Axios API client (typed)
│   │   ├── hooks/useApi.ts       # TanStack Query hooks (optimistic updates)
│   │   ├── hooks/useHotkeys.ts   # Cmd+K, "n", "m", "/" shortcuts
│   │   ├── stores/uiStore.ts     # Zustand store for UI state
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── KanbanBoard.tsx   # @dnd-kit-powered drag-and-drop
│   │   │   ├── TaskColumn.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskDetail.tsx    # Slide-over drawer with markdown + micro-todos
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── MarkdownEditor.tsx
│   │   │   └── MicroTodoList.tsx
│   │   ├── lib/utils.ts
│   │   └── types/index.ts
│   ├── nginx.conf                # SPA + /api reverse-proxy
│   ├── Dockerfile                # Multi-stage build (node → nginx)
│   └── package.json
├── docker-compose.yml            # PostgreSQL + backend + frontend
├── .env.example
└── README.md
```

---

## Quick start (Docker)

```bash
# 1. Configure env
cp .env.example .env
# (edit WEBHOOK_SECRET for production)

# 2. Build + run everything
docker compose up --build

# 3. Open the app
#    Frontend:  http://localhost:3000
#    Swagger:   http://localhost:8000/docs
#    ReDoc:     http://localhost:8000/redoc
```

The first boot auto-creates all tables and seeds the 5 default lifecycle statuses.

---

## Local development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Either run a local Postgres or point DATABASE_URL at a remote one:
export DATABASE_URL="postgresql+asyncpg://projectflow:projectflow@localhost:5432/projectflow"
export WEBHOOK_SECRET="dev-secret"

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # serves on http://localhost:5173, proxies /api → :8000
```

---

## API overview

All endpoints live under `/api/v1`. Full OpenAPI spec at `/api/v1/openapi.json`.

| Resource       | Endpoint                                   | Methods                                  |
|----------------|--------------------------------------------|------------------------------------------|
| Users          | `/users/register`                          | `POST` (create account)                  |
|                | `/users/login`                             | `POST` (get JWT token)                   |
|                | `/users/me`                                | `GET` (current user profile)             |
|                | `/users`                                   | `GET` (list all, auth required)          |
|                | `/users/{id}`                              | `GET`, `PATCH`, `DELETE` (auth required) |
| Projects       | `/projects`                                | `GET`, `POST`                            |
|                | `/projects/{id}`                           | `GET`, `PATCH`, `DELETE`                 |
| Statuses       | `/statuses`                                | `GET`, `POST`                            |
|                | `/statuses/{id}`                           | `PATCH`, `DELETE`                        |
| Tags           | `/tags`                                    | `GET`, `POST`                            |
|                | `/tags/{id}`                               | `PATCH`, `DELETE`                        |
| Tasks          | `/tasks`                                   | `GET`, `POST`                            |
|                | `/tasks/cards`                             | `GET` (lightweight Kanban view)          |
|                | `/tasks/{id}`                              | `GET`, `PATCH`, `DELETE`                 |
|                | `/tasks/{id}/move`                         | `POST` (drag-and-drop)                   |
|                | `/tasks/{id}/notes`                        | `POST`                                   |
|                | `/tasks/{id}/microtodos`                   | `POST`                                   |
| Notes          | `/notes/{id}`                              | `PATCH`, `DELETE`                        |
| Micro-todos    | `/microtodos/{id}`                         | `PATCH`, `DELETE`                        |
| Webhooks       | `/webhooks/git`                            | `POST` (PR merge → status)               |
|                | `/webhooks/deploy`                         | `POST` (deploy success/fail → status)    |

### Webhook examples

```bash
# A merged PR — moves tasks T1, T2 to "Finished"
curl -X POST http://localhost:8000/api/v1/webhooks/git \
  -H "Content-Type: application/json" \
  -H "X-ProjectFlow-Webhook-Secret: change-me-in-production" \
  -d '{
    "action": "merged",
    "pr_title": "feat: ship login flow",
    "pr_number": 42,
    "task_ids": ["T1", "T2"]
  }'

# A successful deployment — moves T1 to "Finished"
curl -X POST http://localhost:8000/api/v1/webhooks/deploy \
  -H "Content-Type: application/json" \
  -H "X-ProjectFlow-Webhook-Secret: change-me-in-production" \
  -d '{
    "status": "success",
    "environment": "production",
    "task_ids": ["T1"]
  }'
```

---

## Keyboard shortcuts

| Shortcut      | Action                                  |
|---------------|-----------------------------------------|
| `Cmd/Ctrl+K`  | Open command palette                    |
| `n`           | New task (opens command palette)        |
| `m`           | Move selected task forward a status     |
| `Shift+M`     | Move selected task backward a status    |
| `/`           | Focus search filter                     |
| `Esc`         | Close detail drawer / command palette   |

---

## Database schema

```text
users
  ├── id (PK)
  ├── email (UNIQUE)
  ├── username (UNIQUE)
  ├── hashed_password
  ├── is_active
  ├── is_superuser
  ├── created_at
  └── updated_at

projects 1──N tasks N──N tags
              │
              ├── 1──N notes
              └── 1──N micro_todos

statuses 1──N tasks

Indexes:
  - users (email) UNIQUE
  - users (username) UNIQUE
  - tasks (project_id, status_id)
  - tasks (project_id, position)
  - micro_todos (task_id, position)
  - tags (name) UNIQUE
```

---

## Tech stack

- **Frontend**: React 18 + Vite 6 + TypeScript 5, Tailwind CSS 3, Zustand 5, TanStack Query 5, @dnd-kit, react-markdown, react-syntax-highlighter, lucide-react
- **Backend**: FastAPI 0.115, SQLAlchemy 2 (async), asyncpg, Pydantic v2, uvicorn, python-jose (JWT), passlib (bcrypt)
- **Database**: PostgreSQL 16
- **DevOps**: Docker multi-stage builds, docker-compose, nginx for SPA + API proxy

---

## License

MIT — see repository for details.
#   d e v _ t r a c k e r  
 