import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckSquare,
  CornerDownLeft,
  FolderPlus,
  Moon,
  Plus,
  Search,
  Square,
  Sun,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/features/board/store/uiStore";
import { useThemeStore } from "@/store/themeStore";
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
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [inlineInput, setInlineInput] = useState<{ type: "task" | "project"; statusId?: string } | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const inlineRef = useRef<HTMLInputElement>(null);
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
      setInlineInput(null);
      setInlineValue("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (inlineInput) {
      setTimeout(() => inlineRef.current?.focus(), 30);
    }
  }, [inlineInput]);

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
          action: () => {
            setInlineInput({ type: "task", statusId: s.id });
            setInlineValue("");
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
          // no-op, just shows the hint
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
      hint: "type a name below",
      icon: <FolderPlus size={14} />,
      group: "Create",
      action: () => {
        setInlineInput({ type: "project" });
        setInlineValue("");
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

    // Theme toggle
    out.push({
      id: "toggle-theme",
      label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      hint: "toggle theme",
      icon: theme === "dark" ? <Sun size={14} /> : <Moon size={14} />,
      group: "Settings",
      action: () => {
        toggleTheme();
        setOpen(false);
      },
    });

    return out;
  }, [
    activeProjectId,
    statuses,
    projects,
    tags,
    theme,
    createTask,
    createProject,
    setActiveProject,
    setActiveProjectObj,
    setOpen,
    toggleTheme,
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] motion-safe:animate-fade-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-pf-border bg-pf-950 shadow-2xl motion-safe:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-pf-border px-3">
          <Search size={16} className="text-pf-700" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent py-3 text-sm text-pf-100 outline-none placeholder-pf-700"
          />
          <kbd className="pf-kbd">Esc</kbd>
        </div>

        {/* Inline input for task/project creation */}
        {inlineInput && (
          <div className="border-b border-pf-border bg-pf-surface px-3 py-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-pf-muted-fg">
              {inlineInput.type === "task" ? "New task title" : "Project name"}
            </div>
            <div className="flex gap-2">
              <input
                ref={inlineRef}
                value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && inlineValue.trim()) {
                    if (inlineInput.type === "task" && inlineInput.statusId && activeProjectId) {
                      await createTask.mutateAsync({
                        project_id: activeProjectId,
                        title: inlineValue.trim(),
                        status_id: inlineInput.statusId,
                      });
                      setOpen(false);
                    } else if (inlineInput.type === "project") {
                      const p = await createProject.mutateAsync({
                        name: inlineValue.trim(),
                        color: "#3B82F6",
                      });
                      setActiveProject(p.id);
                      setActiveProjectObj(p);
                      setOpen(false);
                    }
                  }
                  if (e.key === "Escape") {
                    setInlineInput(null);
                    setInlineValue("");
                  }
                }}
                placeholder={inlineInput.type === "task" ? "Task title…" : "Project name…"}
                className="flex-1 rounded-md border border-pf-border bg-pf-950 px-2 py-1.5 text-sm text-pf-100 outline-none focus:border-pf-400 placeholder-pf-700"
              />
              <button
                onClick={() => {
                  setInlineInput(null);
                  setInlineValue("");
                }}
                className="pf-btn-ghost text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {grouped.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-pf-700">
              No matching commands.
            </div>
          )}

          {grouped.map(([group, groupItems]) => (
            <div key={group} className="mb-1">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-pf-700">
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
                      isActive ? "bg-pf-400 text-white" : "text-pf-100 hover:bg-pf-surface"
                    )}
                  >
                    <span className={isActive ? "text-white" : "text-pf-700"}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hint && (
                      <span
                        className={cn(
                          "text-[10px]",
                          isActive ? "text-white/70" : "text-pf-700"
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
        <div className="flex items-center justify-between border-t border-pf-border px-3 py-2 text-[10px] text-pf-700">
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