import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  CheckSquare,
  GripVertical,
  Trash2,
} from "lucide-react";
import { cn, formatShortDate } from "@/lib/utils";
import type { Status, TaskCard as TaskCardType } from "@/types";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/types";
import {
  useDeleteTask,
  useMoveTask,
  useTaskCards,
  useUpdateTask,
} from "@/features/board/api/hooks";
import { useUIStore } from "@/features/board/store/uiStore";

interface Props {
  task: TaskCardType;
  status: Status;
  statuses: Status[];
}

export function TaskCard({ task, status, statuses }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const updateTask = useUpdateTask();
  const moveTask = useMoveTask();
  const deleteTask = useDeleteTask();
  const openDetail = useUIStore((s) => s.openDetail);

  const { data: allCards } = useTaskCards();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleSaveTitle = () => {
    setEditingTitle(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask.mutate({ id: task.id, data: { title: trimmed } });
    } else {
      setTitle(task.title);
    }
  };

  const handleQuickMove = (newStatusId: string) => {
    if (newStatusId === task.status_id) return;
    const destCount =
      allCards?.filter((c) => c.status_id === newStatusId).length ?? 0;
    moveTask.mutate({
      id: task.id,
      data: { status_id: newStatusId, position: destCount },
    });
  };

  const microProgress =
    task.micro_todo_total > 0
      ? Math.round((task.micro_todo_done / task.micro_todo_total) * 100)
      : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "pf-card group relative cursor-pointer p-2.5 transition-shadow hover:border-pf-700 hover:shadow-md",
        isDragging && "ring-2 ring-pf-400/50"
      )}
      onClick={() => openDetail(task.id)}
    >
      {/* Priority bar (left edge) */}
      <div
        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      />

      {/* Drag handle */}
      <button
        className="absolute -left-1 top-1/2 -translate-y-1/2 cursor-grab text-pf-900 opacity-0 hover:text-pf-700 group-hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        title="Drag to move"
      >
        <GripVertical size={12} />
      </button>

      {/* Title (inline editable) */}
      {editingTitle ? (
        <input
          ref={titleInputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveTitle();
            if (e.key === "Escape") {
              setTitle(task.title);
              setEditingTitle(false);
            }
          }}
          className="pf-input -my-1 -ml-1 text-sm font-medium"
        />
      ) : (
        <h4
          className="cursor-text px-1 text-sm font-medium leading-snug text-pf-100"
          onClick={(e) => {
            e.stopPropagation();
            setEditingTitle(true);
          }}
          title={PRIORITY_LABELS[task.priority] + " priority"}
        >
          {task.title}
        </h4>
      )}

      {/* Description preview */}
      {task.description && (
        <p className="mt-1 line-clamp-2 px-1 text-xs text-pf-700">
          {task.description.replace(/[#*`>\-_~]/g, "").slice(0, 120)}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 px-1">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="pf-tag"
              style={{
                backgroundColor: `${tag.color}22`,
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Micro-todo progress */}
      {microProgress !== null && (
        <div className="mt-2 px-1">
          <div className="flex items-center gap-1.5 text-[10px] text-pf-700">
            <CheckSquare size={11} />
            <span>
              {task.micro_todo_done}/{task.micro_todo_total}
            </span>
            <div className="ml-auto h-1 flex-1 overflow-hidden rounded-full bg-pf-950">
              <div
                className="h-full rounded-full bg-pf-400 transition-all"
                style={{ width: `${microProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer: due date, quick status select, delete */}
      <div className="mt-2 flex items-center gap-1 px-1">
        {task.due_date && (
          <span className="inline-flex items-center gap-1 text-[10px] text-pf-700">
            <Calendar size={11} />
            {formatShortDate(task.due_date)}
          </span>
        )}

        {/* Quick status dropdown */}
        <select
          value={task.status_id}
          onChange={(e) => {
            e.stopPropagation();
            handleQuickMove(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className="ml-auto cursor-pointer rounded border border-transparent bg-transparent px-1 py-0.5 text-[10px] text-pf-700 opacity-0 transition hover:border-teal-800/30 hover:bg-pf-900 group-hover:opacity-100"
          title="Quick move"
          style={{ color: status.color }}
        >
          {statuses.map((s) => (
            <option key={s.id} value={s.id} className="bg-pf-950 text-pf-100">
              {s.name}
            </option>
          ))}
        </select>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this task?")) deleteTask.mutate(task.id);
          }}
          className="rounded p-0.5 text-pf-900 opacity-0 hover:text-red-400 group-hover:opacity-100"
          title="Delete task"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}