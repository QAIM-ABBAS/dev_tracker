import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  GripVertical,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/features/board/store/uiStore";
import { useThemeStore } from "@/store/themeStore";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useReorderProjects,
  useUpdateProject,
} from "@/features/board/api/hooks";
import type { Project } from "@/types";
import { PROJECT_STATUSES } from "@/types";

interface SortableProjectItemProps {
  project: Project;
  isActive: boolean;
  onSelect: (p: Project | null) => void;
  onContextMenu: (e: React.MouseEvent, p: Project) => void;
  contextMenuProject: string | null;
}

function SortableProjectItem({ project, isActive, onSelect, onContextMenu, contextMenuProject }: SortableProjectItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group flex items-center", isDragging && "z-50")}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab p-0.5 text-pf-700 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical size={12} />
      </button>
      <button
        onClick={() => onSelect(project)}
        className={cn(
          "pf-btn-ghost flex-1 justify-start text-xs",
          isActive && "bg-pf-900 text-pf-100"
        )}
        title={project.name}
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: PROJECT_STATUSES.find((s) => s.name === project.status)?.color || "var(--pf-700)" }}
        />
        <span className="flex-1 truncate text-left">{project.name}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu(e, project);
        }}
        className="pf-btn-ghost h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
        title="Project options"
      >
        <MoreHorizontal size={12} />
      </button>
    </div>
  );
}

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
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const { data: rawProjects, isLoading } = useProjects();
  const projects = Array.isArray(rawProjects) ? rawProjects : [];
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const reorderProjects = useReorderProjects();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [addingProject, setAddingProject] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [contextMenuProject, setContextMenuProject] = useState<string | null>(null);
  const [statusSubMenu, setStatusSubMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (!contextMenuProject) {
      setStatusSubMenu(false);
      setMenuPos(null);
      return;
    }
    const close = () => {
      setContextMenuProject(null);
      setStatusSubMenu(false);
      setMenuPos(null);
    };
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

  const handleStartEdit = (p: Project) => {
    setEditingProject(p);
    setEditName(p.name);
    setEditDesc(p.description ?? "");
    setContextMenuProject(null);
    setMenuPos(null);
  };

  const handleSaveEdit = async () => {
    if (!editingProject || !editName.trim()) return;
    await updateProject.mutateAsync({
      id: editingProject.id,
      data: { name: editName.trim(), description: editDesc.trim() || null },
    });
    if (activeProjectId === editingProject.id) {
      setActiveProjectObj({ ...editingProject, name: editName.trim(), description: editDesc.trim() || null });
    }
    setEditingProject(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    const newOrder = arrayMove(projects, oldIndex, newIndex).map((p) => p.id);
    reorderProjects.mutate(newOrder);
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-pf-border bg-pf-950 transition-all duration-200",
        collapsed ? "w-14" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-pf-border px-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pf-400 text-white">
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
        <div className="mx-2 mb-2 rounded-md border border-pf-border bg-pf-900 p-2">
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

      {/* Edit project form */}
      {editingProject && !collapsed && (
        <div className="mx-2 mb-2 rounded-md border border-pf-border bg-pf-900 p-2">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-pf-700">
            Edit project
          </div>
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Project name"
            className="pf-input mb-2 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") setEditingProject(null);
            }}
          />
          <input
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Description (optional)"
            className="pf-input mb-2 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") setEditingProject(null);
            }}
          />
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="pf-btn-primary flex-1 text-xs">
              Save
            </button>
            <button
              onClick={() => setEditingProject(null)}
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
              <div className="border-l border-pf-border ml-5 pl-2">
                {isLoading && (
                  <div className="px-2 py-2 text-xs text-pf-700">Loading…</div>
                )}

                {!isLoading && projects.length > 0 && (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                      {projects.map((p) => (
                        <SortableProjectItem
                          key={p.id}
                          project={p}
                          isActive={activeProjectId === p.id}
                          onSelect={handleSelect}
                          onContextMenu={(e, proj) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            if (contextMenuProject === proj.id) {
                              setContextMenuProject(null);
                              setMenuPos(null);
                            } else {
                              setContextMenuProject(proj.id);
                              setMenuPos({ x: rect.right, y: rect.bottom });
                            }
                            setStatusSubMenu(false);
                          }}
                          contextMenuProject={contextMenuProject}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}

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
        <div className="border-t border-pf-border p-3 text-[10px] text-pf-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings size={11} />
              <span>v1.0.0</span>
            </div>
            <button
              onClick={toggleTheme}
              className="pf-btn-ghost h-7 w-7 p-0"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center border-t border-pf-border p-2">
          <button
            onClick={toggleTheme}
            className="pf-btn-ghost h-7 w-7 p-0"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      )}

      {/* Context menu portal */}
      {contextMenuProject && menuPos && createPortal(
        (() => {
          const p = projects?.find((proj) => proj.id === contextMenuProject);
          if (!p) return null;
          return (
            <div
              className="fixed z-50 w-44 rounded-md border border-pf-border bg-pf-900 shadow-xl"
              style={{ left: menuPos.x + 4, top: menuPos.y }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Status */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusSubMenu(!statusSubMenu);
                }}
                className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-pf-100 hover:bg-pf-950 transition-colors"
              >
                <span>Status</span>
                <ChevronRight size={12} className={cn("text-pf-700 transition-transform", statusSubMenu && "rotate-90")} />
              </button>

              {/* Status submenu */}
              {statusSubMenu && (
                <div className="border-t border-pf-border">
                  {PROJECT_STATUSES.map((s) => (
                    <button
                      key={s.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateProject.mutate({ id: p.id, data: { status: s.name } });
                        setContextMenuProject(null);
                        setStatusSubMenu(false);
                        setMenuPos(null);
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
              )}

              {/* Edit */}
              <div className="border-t border-pf-border">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(p);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-pf-100 hover:bg-pf-950 transition-colors"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              </div>

              {/* Delete */}
              <div className="border-t border-pf-border">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                    setContextMenuProject(null);
                    setMenuPos(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-b-md px-3 py-1.5 text-xs text-[var(--pf-destructive)] hover:bg-[var(--pf-destructive)] hover:text-white transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          );
        })(),
        document.body
      )}
    </aside>
  );
}