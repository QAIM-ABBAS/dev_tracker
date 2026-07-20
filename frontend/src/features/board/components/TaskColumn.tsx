import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status, TaskCard as TaskCardType } from "@/types";
import { TaskCard } from "./TaskCard";
import { useCreateTask } from "@/features/board/api/hooks";
import { useUIStore } from "@/features/board/store/uiStore";

interface Props {
  status: Status;
  tasks: TaskCardType[];
  statuses: Status[];
}

export function TaskColumn({ status, tasks, statuses }: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  const createTask = useCreateTask();

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status.id}`,
    data: { type: "column", statusId: status.id },
  });

  const handleCreate = async () => {
    if (!title.trim()) return;
    if (!activeProjectId) {
      alert("Please select a project from the sidebar first.");
      return;
    }
    await createTask.mutateAsync({
      project_id: activeProjectId,
      title: title.trim(),
      status_id: status.id,
    });
    setTitle("");
    setAdding(false);
  };

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      {/* Column header */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: status.color }}
        />
        <h3 className="flex-1 text-xs font-semibold uppercase tracking-wider text-pf-400">
          {status.name}
        </h3>
        <span className="rounded-full bg-pf-950 px-1.5 py-0.5 text-[10px] text-pf-muted-fg">
          {tasks.length}
        </span>
        <button
          onClick={() => setAdding(true)}
          className="rounded p-0.5 text-pf-700 hover:bg-pf-900 hover:text-pf-400"
          title="Add task"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 overflow-y-auto rounded-lg p-1 transition-colors",
          isOver && "bg-pf-400/5 ring-2 ring-inset ring-pf-400/30"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              status={status}
              statuses={statuses}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-pf-border py-2 text-[11px] text-pf-700 hover:border-pf-400/50 hover:text-pf-400 transition-colors"
          >
            <Plus size={12} />
            Add / Drag task here
          </button>
        )}

        {tasks.length > 0 && tasks.length < 5 && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-pf-border py-2 text-[11px] text-pf-700 hover:border-pf-400/50 hover:text-pf-400 transition-colors"
          >
            <Plus size={12} />
            Add / Drag task here
          </button>
        )}

        {/* Quick-add input */}
        {adding && (
          <div className="rounded-lg border border-pf-border bg-pf-900 p-2 motion-safe:animate-scale-in">
            <textarea
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title… (Enter to save, Esc to cancel)"
              className="pf-input min-h-[60px] resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCreate();
                }
                if (e.key === "Escape") {
                  setAdding(false);
                  setTitle("");
                }
              }}
            />
            <div className="mt-2 flex gap-1">
              <button onClick={handleCreate} className="pf-btn-primary flex-1 text-xs">
                Add task
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setTitle("");
                }}
                className="pf-btn-ghost text-xs"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}