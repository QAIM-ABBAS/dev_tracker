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
        <h3 className="flex-1 text-xs font-semibold uppercase tracking-wider text-[#86b9b0]">
          {status.name}
        </h3>
        <span className="rounded-full bg-[#042630] px-1.5 py-0.5 text-[10px] text-[#4c7273]">
          {tasks.length}
        </span>
        <button
          onClick={() => setAdding(true)}
          className="rounded p-0.5 text-[#4c7273] hover:bg-[#042630] hover:text-[#86b9b0]"
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
          isOver && "bg-[#86b9b0]/5 ring-1 ring-[#86b9b0]/30"
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
          <div className="rounded-lg border border-dashed border-teal-800/30 p-4 text-center text-[11px] text-[#4c7273]">
            Drop tasks here
          </div>
        )}

        {/* Quick-add input */}
        {adding && (
          <div className="rounded-lg border border-teal-800/30 bg-[#042630] p-2 animate-scale-in">
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