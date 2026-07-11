import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/features/board/store/uiStore";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "@/features/board/api/hooks";
import type { Project } from "@/types";
import { PROJECT_STATUSES } from "@/types";

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const projectsExpanded = useUIStore((s) => s.projectsExpanded);
  const toggleProjects = useUIStore((s) => s.toggleProjects);
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
  const [contextMenuProject, setContextMenuProject] = useState<string | null>(null);

  useEffect(() => {
    if (!contextMenuProject) return;
    const close = () => setContextMenuProject(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenuProject]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const p = await createProject.mutateAsync({
      name: newName.trim(),
      description: newDesc.trim() || null,
      color: "#86b9b0",
      status: "Planning",
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
        "flex h-full flex-col border-r border-teal-800/30 bg-pf-950 transition-all duration-200",
        collapsed ? "w-14" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-teal-800/30 px-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pf-700 text-white">
          <Zap size={16} strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="flex flex-1 flex-col leading-tight">
            <span className="text-sm font-semibold text-pf-100">ProjectFlow</span>
            <span className="text-[10px] uppercase tracking-wider text-pf-700">
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
        <div className="mx-2 mb-2 rounded-md border border-teal-800/30 bg-pf-900 p-2">
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
          <div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-pf-700">
            Projects
          </div>
        )}

        <button
          onClick={toggleProjects}
          className={cn(
            "pf-btn-ghost w-full justify-start text-xs",
            activeProjectId === null && !projectsExpanded && "bg-pf-900 text-pf-100"
          )}
          title={projectsExpanded ? "Collapse projects" : "Expand projects"}
        >
          <FolderKanban size={14} />
          {!collapsed && <span className="flex-1 text-left">All Projects</span>}
          {!collapsed && (
            projectsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          )}
        </button>

        {!collapsed && (
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-200 ease-in-out",
              projectsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden min-h-0">
              <div className="border-l border-pf-700/30 ml-5 pl-2">
                {isLoading && (
                  <div className="px-2 py-2 text-xs text-pf-700">Loading…</div>
                )}

                {projects?.map((p) => (
                  <div
                    key={p.id}
                    className="group relative flex items-center"
                  >
                    <button
                      onClick={() => handleSelect(p)}
                      className={cn(
                        "pf-btn-ghost flex-1 justify-start text-xs",
                        activeProjectId === p.id && "bg-pf-900 text-pf-100"
                      )}
                      title={p.name}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: p.color || "var(--pf-400)" }}
                      />
                      <span className="flex-1 truncate text-left">{p.name}</span>
                    </button>
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

                    {/* Context menu */}
                    {contextMenuProject === p.id && (
                      <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-teal-800/30 bg-pf-900 shadow-xl">
                        {/* Status submenu */}
                        <div className="group/sub relative">
                          <div className="flex items-center justify-between px-3 py-1.5 text-xs text-pf-100 hover:bg-pf-950 cursor-default">
                            <span>Status</span>
                            <ChevronRight size={12} className="text-pf-700" />
                          </div>
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
                  </div>
                ))}

                {projects && projects.length === 0 && (
                  <button
                    onClick={() => setAddingProject(true)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-pf-700 hover:bg-pf-900 hover:text-pf-400 transition-colors"
                  >
                    <Plus size={12} />
                    <span>Add project</span>
                  </button>
                )}

                {projects && projects.length > 0 && projects.length < 12 && (
                  <button
                    onClick={() => setAddingProject(true)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-pf-700 hover:bg-pf-900 hover:text-pf-400 transition-colors"
                  >
                    <Plus size={12} />
                    <span>Add project</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-teal-800/30 p-3 text-[10px] text-pf-700">
          <div className="flex items-center gap-2">
            <Settings size={11} />
            <span>v1.0.0 · FastAPI + React</span>
          </div>
        </div>
      )}
    </aside>
  );
}