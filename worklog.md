---
Task ID: 1
Agent: main (super-z)
Task: Build ProjectFlow — a FastAPI + React (Vite) + TypeScript project tracking app with PostgreSQL, Docker, and a full Kanban UX. NON-NEGOTIABLE: FastAPI only, React + TS only, NO Next.js.

Work Log:
- Created project structure: /backend (FastAPI), /frontend (React+Vite), root docker-compose.yml + .env
- Backend: async SQLAlchemy 2.0 models (Project, Status, Tag, Task, Note, MicroTodo, TaskTag M2M) with strict indexing on (project_id, status_id) and (project_id, position)
- Backend: Pydantic v2 schemas, 7 routers (projects, statuses, tags, tasks, notes, microtodos, webhooks), FastAPI main app with lifespan auto-creating tables + seeding 5 default lifecycle statuses
- Backend: drag-and-drop /tasks/{id}/move endpoint, nested /tasks/{id}/notes and /tasks/{id}/microtodos, git+deploy webhooks with shared-secret auth
- Frontend: Vite 6 + React 18 + TS 5 + Tailwind 3, Zustand UI store, TanStack Query 5 with optimistic updates + rollback on all mutations
- Frontend: @dnd-kit-powered Kanban board, inline-editable task cards with priority bars, micro-todo progress bars, quick status dropdown on hover
- Frontend: Cmd+K command palette, slide-over TaskDetail drawer with MarkdownEditor (react-markdown + remark-gfm + syntax highlighting), MicroTodoList checklist, global hotkeys (Cmd+K, n, m, /, Esc)
- Frontend: nginx multi-stage Dockerfile serving SPA + reverse-proxying /api → backend:8030
- Root docker-compose.yml orchestrating PostgreSQL 16 + backend + frontend on a shared network
- Fixed FastAPI 0.115 assertion (204 responses need Response return type) across 6 DELETE endpoints
- Fixed TypeScript scope bugs in useApi.ts onError handlers (moved `key` into the onMutate return context)
- Verified: TypeScript compiles cleanly (tsc -b), Vite production build succeeds, FastAPI app instantiates with 50 routes, OpenAPI schema generates with 26 schemas + 22 paths

Stage Summary:
- Backend: 9 Python files, 50 HTTP routes, async SQLAlchemy, auto-seeds default statuses on first boot, Swagger at /docs
- Frontend: 8 React components + 4 hooks/stores/types/lib, builds to ~1.1MB bundle (gzip 392KB)
- Stack EXACTLY as specified: FastAPI + React (Vite) + TypeScript + Tailwind + Zustand + TanStack Query + PostgreSQL + SQLAlchemy async + Docker multi-stage + docker-compose. NO Next.js.
- Run with: `docker compose up --build` → frontend http://localhost:3000, backend http://localhost:8030/docs
