import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Plus,
  Search,
  Settings,
  Trash2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "@/hooks/useApi";
import type { Project } from "@/types";

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  const setActiveProject = useUIStore((s) => s.setActiveProject);
  const setActiveProjectObj = useUIStore((s) => s.setActiveProjectObj);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);

  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();

  const [addingProject, setAddingProject] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const p = await createProject.mutateAsync({
      name: newName.trim(),
      description: newDesc.trim() || null,
      color: "#6366f1",
    });
    setNewName("");
    setNewDesc("");
    setAddingProject(false);
    setActiveProject(p.id);
    setActiveProjectObj(p);
  };

  const handleSelect = (p: Project | null) => {
    setActiveProject(p?.id ?? null);
    setActiveProjectObj(p);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    await deleteProject.mutateAsync(id);
    if (activeProjectId === id) handleSelect(null);
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-ink-800 bg-ink-900/40 transition-all duration-200",
        collapsed ? "w-14" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-ink-800 px-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-white">
          <Zap size={16} strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="flex flex-1 flex-col leading-tight">
            <span className="text-sm font-semibold text-ink-100">ProjectFlow</span>
            <span className="text-[10px] uppercase tracking-wider text-ink-500">
              dev tracker
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="pf-btn-ghost h-7 w-7 p-0"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col gap-1 p-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="pf-btn-ghost justify-start text-xs"
          title="Command palette (Cmd+K)"
        >
          <Search size={14} />
          {!collapsed && <span className="flex-1 text-left">Quick find…</span>}
          {!collapsed && <span className="pf-kbd">⌘K</span>}
        </button>
        <button
          onClick={() => setAddingProject((v) => !v)}
          className="pf-btn-ghost justify-start text-xs"
          title="New project"
        >
          <Plus size={14} />
          {!collapsed && <span>New project</span>}
        </button>
      </div>

      {/* New project form */}
      {addingProject && !collapsed && (
        <div className="mx-2 mb-2 rounded-md border border-ink-700 bg-ink-900 p-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            className="pf-input mb-2 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setAddingProject(false);
            }}
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="pf-input mb-2 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setAddingProject(false);
            }}
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="pf-btn-primary flex-1 text-xs">
              Create
            </button>
            <button
              onClick={() => setAddingProject(false)}
              className="pf-btn-ghost text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Projects list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {!collapsed && (
          <div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
            Projects
          </div>
        )}

        <button
          onClick={() => handleSelect(null)}
          className={cn(
            "pf-btn-ghost w-full justify-start text-xs",
            activeProjectId === null && "bg-ink-800 text-ink-100"
          )}
          title="All projects"
        >
          <FolderKanban size={14} />
          {!collapsed && <span className="flex-1 text-left">All Projects</span>}
        </button>

        {isLoading && !collapsed && (
          <div className="px-2 py-2 text-xs text-ink-500">Loading…</div>
        )}

        {projects?.map((p) => (
          <div
            key={p.id}
            className="group flex items-center"
          >
            <button
              onClick={() => handleSelect(p)}
              className={cn(
                "pf-btn-ghost flex-1 justify-start text-xs",
                activeProjectId === p.id && "bg-ink-800 text-ink-100"
              )}
              title={p.name}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: p.color }}
              />
              {!collapsed && (
                <span className="flex-1 truncate text-left">{p.name}</span>
              )}
              {!collapsed && (
                <span className="text-[10px] text-ink-500">{p.task_count}</span>
              )}
            </button>
            {!collapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(p.id);
                }}
                className="pf-btn-ghost h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                title="Delete project"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}

        {projects && projects.length === 0 && !collapsed && (
          <div className="px-2 py-3 text-xs text-ink-500">
            No projects yet. Create one above.
          </div>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-ink-800 p-3 text-[10px] text-ink-500">
          <div className="flex items-center gap-2">
            <Settings size={11} />
            <span>v1.0.0 · FastAPI + React</span>
          </div>
        </div>
      )}
    </aside>
  );
}
