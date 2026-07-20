import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ChevronDown,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import { notesApi } from "@/features/board/api/client";
import { useUIStore } from "@/features/board/store/uiStore";
import {
  useAddNote,
  useDeleteTask,
  useDeleteNote,
  useStatuses,
  useTags,
  useTask,
  useUpdateTask,
} from "@/features/board/api/hooks";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/types";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { MicroTodoList } from "@/components/ui/MicroTodoList";

export function TaskDetail() {
  const taskId = useUIStore((s) => s.detailTaskId);
  const closeDetail = useUIStore((s) => s.closeDetail);
  const { data: rawStatuses } = useStatuses();
  const { data: rawTags } = useTags();
  const { data: task, isLoading } = useTask(taskId);
  const statuses = Array.isArray(rawStatuses) ? rawStatuses : [];
  const tags = Array.isArray(rawTags) ? rawTags : [];
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();
  const qc = useQueryClient();

  const [newNote, setNewNote] = useState("");
  const [title, setTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task) setTitle(task.title);
  }, [task?.id]);

  // Auto-focus title on open
  useEffect(() => {
    if (taskId && !isLoading) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [taskId, isLoading]);

  // Escape key to close
  useEffect(() => {
    if (!taskId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [taskId]);

  if (!taskId) return null;

  const handleClose = () => closeDetail();

  const handleSaveTitle = () => {
    const trimmed = title.trim();
    if (trimmed && task && trimmed !== task.title) {
      updateTask.mutate({ id: task.id, data: { title: trimmed } });
    } else if (task) {
      setTitle(task.title);
    }
  };

  const handleStatusChange = (statusId: string) => {
    if (!task) return;
    updateTask.mutate({ id: task.id, data: { status_id: statusId } });
  };

  const handlePriorityChange = (priority: number) => {
    if (!task) return;
    updateTask.mutate({ id: task.id, data: { priority } });
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteTask.mutateAsync(task.id);
    closeDetail();
  };

  const handleAddNote = async () => {
    if (!task || !newNote.trim()) return;
    await addNote.mutateAsync({ taskId: task.id, content: newNote.trim() });
    setNewNote("");
  };

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/40 motion-safe:animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Task detail"
    >
      <div
        ref={panelRef}
        className="flex h-full w-full max-w-xl flex-col border-l border-pf-border bg-pf-950 shadow-2xl motion-safe:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex h-14 items-center gap-2 border-b border-pf-border px-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-pf-muted-fg">
            Task detail
          </span>
          <div className="ml-auto flex items-center gap-1">
            {confirmDelete ? (
              <>
                <button
                  onClick={handleDelete}
                  className="rounded px-2 py-1 text-xs text-white bg-[var(--pf-destructive)] hover:bg-[var(--pf-destructive)]/80 transition-colors"
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="pf-btn-ghost h-8 px-2 text-xs"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleDelete}
                className="pf-btn-ghost h-8 px-2 text-xs text-[var(--pf-destructive)] hover:bg-[var(--pf-destructive)]/10"
                title="Delete task"
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}
            <button
              onClick={handleClose}
              className="pf-btn-ghost h-8 w-8 p-0"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {isLoading || !task ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="animate-pulse text-sm text-pf-700">Loading task…</div>
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {/* Title */}
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-full bg-transparent text-lg font-semibold text-pf-100 outline-none"
              placeholder="Task title"
            />

            {/* Meta row: status + priority + due date */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs">
                <span className="text-pf-muted-fg">Status</span>
                <div className="relative">
                  <select
                    value={task.status_id}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="appearance-none rounded-md border border-pf-border bg-pf-900 py-1 pl-2 pr-7 text-xs text-pf-100 outline-none focus:border-pf-400"
                  >
                    {statuses?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-pf-700"
                  />
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs">
                <span className="text-pf-muted-fg">Priority</span>
                <div className="flex gap-0.5">
                  {PRIORITY_LABELS.map((label, i) => (
                    <button
                      key={label}
                      onClick={() => handlePriorityChange(i)}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium transition",
                        task.priority === i
                          ? "text-white"
                          : "text-pf-muted-fg hover:text-pf-100"
                      )}
                      style={{
                        backgroundColor:
                          task.priority === i ? PRIORITY_COLORS[i] : "transparent",
                      }}
                      title={label}
                    >
                      {label[0]}
                    </button>
                  ))}
                </div>
              </label>

              {task.due_date && (
                <span className="inline-flex items-center gap-1 text-xs text-pf-muted-fg">
                  <Calendar size={12} />
                  Due {formatDateTime(task.due_date)}
                </span>
              )}

              <span className="ml-auto text-[10px] text-pf-700">
                Created {timeAgo(task.created_at)} · Updated {timeAgo(task.updated_at)}
              </span>
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-pf-muted-fg">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => {
                    const selected = (task.tags ?? []).some((t) => t.id === tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => {
                          const currentTags = task.tags ?? [];
                          const next = selected
                            ? currentTags.filter((t) => t.id !== tag.id).map((t) => t.id)
                            : [...currentTags.map((t) => t.id), tag.id];
                          updateTask.mutate({ id: task.id, data: { tag_ids: next } });
                        }}
                        className={cn(
                          "pf-tag transition",
                          selected ? "ring-1 ring-white/30" : "opacity-50 hover:opacity-100"
                        )}
                        style={{
                          backgroundColor: `${tag.color}22`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description (markdown) */}
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-pf-muted-fg">
                Description
              </h4>
              <MarkdownEditor
                value={task.description ?? ""}
                onSave={(value) =>
                  updateTask.mutate({ id: task.id, data: { description: value } })
                }
                placeholder="Add a markdown description. Supports code blocks, lists, tables…"
                minHeight={140}
              />
            </div>

            {/* Micro-todos */}
            <div>
              <MicroTodoList taskId={task.id} todos={task.micro_todos ?? []} />
            </div>

            {/* Notes / comments */}
            <div>
              <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-pf-muted-fg">
                <MessageSquare size={12} />
                Notes & Comments
              </h4>

              <div className="space-y-2">
                {(task.notes ?? []).length === 0 && (
                  <p className="text-xs text-pf-700">
                    No notes yet. Add context, decisions, or code snippets below.
                  </p>
                )}
                {(task.notes ?? []).map((note) => (
                  <div
                    key={note.id}
                    className="group rounded-md border border-pf-border bg-pf-900/60 p-2"
                  >
                    <div className="mb-1 flex items-center justify-between text-[10px] text-pf-700">
                      <span>{timeAgo(note.created_at)}</span>
                      <button
                        onClick={() => deleteNote.mutate(note.id)}
                        className="opacity-0 hover:text-red-400 group-hover:opacity-100"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <MarkdownEditor
                      value={note.content}
                      onSave={async (value) => {
                        await notesApi.update(note.id, value);
                        qc.invalidateQueries({ queryKey: ["task", task.id] });
                      }}
                      editable={false}
                      minHeight={40}
                    />
                  </div>
                ))}
              </div>

              {/* Quick add note */}
              <div className="mt-2 rounded-md border border-pf-border bg-pf-900/60 p-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note… (markdown supported)"
                  className="w-full resize-y bg-transparent text-sm text-pf-100 outline-none placeholder-pf-900"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                <div className="flex justify-end gap-1">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="pf-btn-primary text-xs"
                  >
                    <Plus size={12} />
                    Add note
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}