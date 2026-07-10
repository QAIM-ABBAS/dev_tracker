import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckSquare,
  CornerDownLeft,
  FolderPlus,
  Plus,
  Search,
  Square,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/features/board/store/uiStore";
import {
  useCreateProject,
  useCreateTask,
  useProjects,
  useStatuses,
  useTags,
} from "@/features/board/api/hooks";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const setActiveProject = useUIStore((s) => s.setActiveProject);
  const setActiveProjectObj = useUIStore((s) => s.setActiveProjectObj);
  const activeProjectId = useUIStore((s) => s.activeProjectId);

  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: projects } = useProjects();
  const { data: statuses } = useStatuses();
  const { data: tags } = useTags();
  const createTask = useCreateTask();
  const createProject = useCreateProject();

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const out: CommandItem[] = [];

    // Task creation: one per status
    if (activeProjectId && statuses) {
      for (const s of statuses) {
        out.push({
          id: `new-task-${s.id}`,
          label: `New task → ${s.name}`,
          hint: "creates a task in this status",
          icon: <Plus size={14} />,
          group: "Create task",
          action: async () => {
            const title = prompt(`Task title for "${s.name}":`);
            if (!title) return;
            const t = await createTask.mutateAsync({
              project_id: activeProjectId,
              title,
              status_id: s.id,
            });
            setOpen(false);
            return t;
          },
        });
      }
    } else if (!activeProjectId && statuses) {
      out.push({
        id: "new-task-needs-project",
        label: "New task (select a project first)",
        hint: "click a project in the sidebar",
        icon: <Plus size={14} />,
        group: "Create task",
        action: () => {
          alert("Please select a project in the sidebar first.");
        },
      });
    }

    // Project switching
    for (const p of projects ?? []) {
      out.push({
        id: `switch-${p.id}`,
        label: p.name,
        hint: "switch to project",
        icon: <FolderPlus size={14} />,
        group: "Switch project",
        action: () => {
          setActiveProject(p.id);
          setActiveProjectObj(p);
          setOpen(false);
        },
      });
    }

    // New project
    out.push({
      id: "new-project",
      label: "Create new project…",
      hint: "opens an inline prompt",
      icon: <FolderPlus size={14} />,
      group: "Create",
      action: async () => {
        const name = prompt("Project name:");
        if (!name) return;
        const p = await createProject.mutateAsync({
          name,
          color: "#86b9b0",
        });
        setActiveProject(p.id);
        setActiveProjectObj(p);
        setOpen(false);
      },
    });

    // Tag info
    if (tags && tags.length > 0) {
      for (const t of tags.slice(0, 5)) {
        out.push({
          id: `tag-${t.id}`,
          label: `Tag: ${t.name}`,
          hint: `${tags.length} tags total`,
          icon: <Zap size={14} />,
          group: "Tags",
          action: () => setOpen(false),
        });
      }
    }

    return out;
  }, [
    activeProjectId,
    statuses,
    projects,
    tags,
    createTask,
    createProject,
    setActiveProject,
    setActiveProjectObj,
    setOpen,
  ]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q) ||
        i.hint?.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Group the filtered items
  const grouped = useMemo(() => {
    const m = new Map<string, CommandItem[]>();
    for (const i of filtered) {
      if (!m.has(i.group)) m.set(i.group, []);
      m.get(i.group)!.push(i);
    }
    return Array.from(m.entries());
  }, [filtered]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[activeIdx]?.action();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  let runningIdx = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-teal-800/30 bg-[#041421] shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-teal-800/30 px-3">
          <Search size={16} className="text-[#4c7273]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent py-3 text-sm text-[#d0d6d6] outline-none placeholder-[#4c7273]"
          />
          <kbd className="pf-kbd">Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {grouped.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-[#4c7273]">
              No matching commands.
            </div>
          )}

          {grouped.map(([group, groupItems]) => (
            <div key={group} className="mb-1">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#4c7273]">
                {group}
              </div>
              {groupItems.map((item) => {
                runningIdx += 1;
                const idx = runningIdx;
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={item.id}
                    data-idx={idx}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => item.action()}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                      isActive ? "bg-[#4c7273] text-white" : "text-[#d0d6d6] hover:bg-[#042630]"
                    )}
                  >
                    <span className={isActive ? "text-white" : "text-[#4c7273]"}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hint && (
                      <span
                        className={cn(
                          "text-[10px]",
                          isActive ? "text-white/70" : "text-[#4c7273]"
                        )}
                      >
                        {item.hint}
                      </span>
                    )}
                    {isActive && (
                      <CornerDownLeft size={12} className="text-white/70" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-teal-800/30 px-3 py-2 text-[10px] text-[#4c7273]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Square size={9} /> ↑↓ navigate
            </span>
            <span className="flex items-center gap-1">
              <CheckSquare size={9} /> ↵ select
            </span>
          </div>
          <span>ProjectFlow</span>
        </div>
      </div>
    </div>
  );
}