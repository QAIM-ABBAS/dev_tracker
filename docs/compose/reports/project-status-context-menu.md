---
feature: project-status-context-menu
status: delivered
specs: []
plans:
  - ../plans/2026-07-11-project-status-context-menu.md
branch: main
commits: (inline execution)
---

# Project Status Field + Context Menu — Final Report

## What Was Built

Projects now have a `status` field (default: "Planning") that tracks their lifecycle stage. The sidebar project items replaced the trash icon with a three-dots menu that provides access to status changes and deletion.

When hovering or clicking the three-dots icon on a project, a context menu appears with:
- **Status** — a submenu showing all 5 status options with their colors (Planning, Yet to Start, In Process, Blocked, Finished). The current status is highlighted.
- **Delete** — red delete option with confirmation prompt.

## Architecture

### Backend Changes

**`backend/app/models/project.py`** — Added `status: Mapped[str]` column with `String(50)` type, defaulting to `"Planning"`.

**`backend/app/schemas/project.py`** — Added `status: str = "Planning"` to `ProjectBase` and `status: Optional[str] = None` to `ProjectUpdate`. The `ProjectOut` schema inherits from `ProjectBase` so it automatically includes status.

**`backend/alembic/versions/2026_07_11_add_project_status.py`** — Migration adds the `status` column with `server_default="Planning"`.

### Frontend Changes

**`frontend/src/types/index.ts`** — Added `status: string` to the `Project` interface. Added `PROJECT_STATUSES` constant with name/color pairs for all 5 statuses.

**`frontend/src/components/layouts/Sidebar.tsx`** — Replaced the trash icon with `MoreHorizontal` (three-dots) icon. Added context menu state management and click-outside handler. The context menu uses CSS hover for the status submenu (`group-hover/sub:block`).

### Status Values

| Status | Color |
|--------|-------|
| Planning | `#8b5cf6` (purple) |
| Yet to Start | `#64748b` (gray) |
| In Process | `#0ea5e9` (blue) |
| Blocked | `#ef4444` (red) |
| Finished | `#22c55e` (green) |

## Usage

1. **Change project status**: Hover over a project in the sidebar → click three-dots → hover/click "Status" → select a status
2. **Delete project**: Hover over a project → click three-dots → click "Delete" → confirm
3. **New projects**: Automatically created with "Planning" status

## Verification

- Backend: `python -c "from app.main import app"` — imports successfully
- Frontend: `npm run lint` — TypeScript check passes
- Frontend: `npx vite build` — production build successful

## Journey Log

- [lesson] Projects don't have a status field by default — the user wanted one added, so we extended the Project model rather than using task statuses as a workaround.
