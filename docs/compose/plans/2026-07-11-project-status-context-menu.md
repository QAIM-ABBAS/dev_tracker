# Project Status Field + Context Menu Implementation Plan

> [!NOTE]
> This document may not reflect the current implementation.
> See the final report for up-to-date state:
> [Final Report](../reports/project-status-context-menu.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `status` field to Projects (default "Planning") and replace the sidebar trash icon with a three-dots context menu containing a Status submenu and red Delete option.

**Architecture:** Backend gets a new `status` column on the projects table via Alembic migration. Frontend Project type gains a `status` field. Sidebar project items get a three-dots menu (lucide `MoreHorizontal`) with hover-expand Status submenu showing all 5 statuses with their colors, plus a red Delete option.

**Tech Stack:** Python/FastAPI/SQLAlchemy (backend), React/TypeScript/Tailwind (frontend), Alembic (migration)

## Global Constraints

- Default project status on creation: `"Planning"`
- Status values: `Planning`, `Yet to Start`, `In Process`, `Blocked`, `Finished`
- Status colors match the existing Status model seeds: `#8b5cf6`, `#64748b`, `#0ea5e9`, `#ef4444`, `#22c55e`
- Context menu opens on hover/click of three-dots icon
- Status submenu opens on hover/click of "Status" row, positioned to the right
- Delete option styled in red with confirmation prompt

---

### Task 1: Add `status` column to Project model + schemas (backend)

**Files:**
- Modify: `backend/app/models/project.py`
- Modify: `backend/app/schemas/project.py`

**Interfaces:**
- Consumes: existing Project model/schema
- Produces: Project with `status: str` field, default `"Planning"`

- [ ] **Step 1: Update Project ORM model**

Add `status` column to `backend/app/models/project.py`:

```python
# In Project class, after the color field:
status: Mapped[str] = mapped_column(String(50), default="Planning")
```

- [ ] **Step 2: Update Pydantic schemas**

In `backend/app/schemas/project.py`:

```python
class ProjectBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    color: str = "#6366f1"
    status: str = "Planning"  # Add this

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    status: Optional[str] = None  # Add this
```

- [ ] **Step 3: Verify backend starts**

Run: `cd backend && python -c "from app.models.project import Project; print(Project.status.property.columns[0].default.arg)"`
Expected: `Planning`

---

### Task 2: Create Alembic migration for status column

**Files:**
- Create: `backend/alembic/versions/2026_07_11_add_project_status.py`

**Interfaces:**
- Consumes: updated Project model from Task 1
- Produces: migration that adds `status` VARCHAR(50) DEFAULT 'Planning' to projects table

- [ ] **Step 1: Create migration file**

```python
"""add project status

Revision ID: 001
Revises:
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("status", sa.String(50), server_default="Planning", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("projects", "status")
```

- [ ] **Step 2: Verify migration syntax**

Run: `cd backend && python -c "import alembic.config; print('migration file valid')"`
Expected: no import errors

---

### Task 3: Update frontend Project type + Sidebar context menu

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/components/layouts/Sidebar.tsx`

**Interfaces:**
- Consumes: Project type, useStatuses hook, useUpdateProject hook
- Produces: Sidebar with three-dots menu, status submenu, delete option

- [ ] **Step 1: Add `status` to Project type**

In `frontend/src/types/index.ts`, update Project interface:

```typescript
export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;  // Add this
  created_at: string;
  updated_at: string;
  task_count: number;
}
```

- [ ] **Step 2: Define project status options constant**

In `frontend/src/types/index.ts`, add after PRIORITY_COLORS:

```typescript
export const PROJECT_STATUSES = [
  { name: "Planning", color: "#8b5cf6" },
  { name: "Yet to Start", color: "#64748b" },
  { name: "In Process", color: "#0ea5e9" },
  { name: "Blocked", color: "#ef4444" },
  { name: "Finished", color: "#22c55e" },
] as const;
```

- [ ] **Step 3: Replace trash icon with three-dots menu in Sidebar**

In `frontend/src/components/layouts/Sidebar.tsx`:

1. Add imports: `MoreHorizontal` from lucide-react, `PROJECT_STATUSES` from types
2. Add state: `const [contextMenuProject, setContextMenuProject] = useState<string | null>(null)`
3. Replace the trash button with:

```tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    setContextMenuProject(contextMenuProject === p.id ? null : p.id);
  }}
  className="pf-btn-ghost h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
  title="Project options"
>
  <MoreHorizontal size={12} />
</button>
```

4. Add context menu dropdown after the project button (inside the same `group` div):

```tsx
{contextMenuProject === p.id && (
  <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-teal-800/30 bg-pf-900 shadow-xl">
    {/* Status submenu */}
    <div className="group/sub relative">
      <div className="flex items-center justify-between px-3 py-1.5 text-xs text-pf-100 hover:bg-pf-950 cursor-default">
        <span>Status</span>
        <ChevronRight size={12} className="text-pf-700" />
      </div>
      {/* Status options - shown on hover */}
      <div className="hidden group-hover/sub:block absolute left-full top-0 ml-1 w-40 rounded-md border border-teal-800/30 bg-pf-900 shadow-xl">
        {PROJECT_STATUSES.map((s) => (
          <button
            key={s.name}
            onClick={(e) => {
              e.stopPropagation();
              updateProject.mutate({ id: p.id, data: { status: s.name } });
              setContextMenuProject(null);
            }}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-pf-950",
              p.status === s.name ? "text-pf-100" : "text-pf-700"
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </button>
        ))}
      </div>
    </div>
    {/* Delete */}
    <div className="border-t border-teal-800/30">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(p.id);
          setContextMenuProject(null);
        }}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 size={12} />
        Delete
      </button>
    </div>
  </div>
)}
```

5. Add `relative` to the project item wrapper div: `className="group relative flex items-center"`

6. Add click-outside handler to close menu:

```tsx
useEffect(() => {
  if (!contextMenuProject) return;
  const close = () => setContextMenuProject(null);
  window.addEventListener("click", close);
  return () => window.removeEventListener("click", close);
}, [contextMenuProject]);
```

- [ ] **Step 4: Pass default status on project creation**

In Sidebar `handleCreate`, add `status: "Planning"` to the createProject call:

```typescript
const p = await createProject.mutateAsync({
  name: newName.trim(),
  description: newDesc.trim() || null,
  color: "#86b9b0",
  status: "Planning",
});
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd frontend && npm run lint`
Expected: no errors

---

### Task 4: Verify end-to-end

- [ ] **Step 1: Run backend type check**

Run: `cd backend && python -c "from app.main import app; print('OK')"`
Expected: `OK`

- [ ] **Step 2: Run frontend type check**

Run: `cd frontend && npm run lint`
Expected: no errors

- [ ] **Step 3: Run frontend build**

Run: `cd frontend && npx vite build`
Expected: successful build
