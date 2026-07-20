import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MicroTodo as MicroTodoType } from "@/types";
import {
  useAddMicroTodo,
  useDeleteMicroTodo,
  useToggleMicroTodo,
} from "@/features/board/api/hooks";

interface Props {
  taskId: string;
  todos: MicroTodoType[];
}

export function MicroTodoList({ taskId, todos }: Props) {
  const [newText, setNewText] = useState("");
  const addTodo = useAddMicroTodo();
  const toggleTodo = useToggleMicroTodo();
  const deleteTodo = useDeleteMicroTodo();
  const safeTodos = todos ?? [];

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    await addTodo.mutateAsync({ taskId, content: text });
    setNewText("");
  };

  const total = safeTodos.length;
  const done = safeTodos.filter((t) => t.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      {/* Header + progress */}
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-pf-400">
          Checklist
        </h4>
        {total > 0 && (
          <span className="text-[10px] text-pf-muted-fg">
            {done}/{total} · {pct}%
          </span>
        )}
      </div>
      {total > 0 && (
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-pf-950">
          <div
            className="h-full bg-pf-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Existing items */}
      <ul className="space-y-1">
        {safeTodos.map((t) => (
          <li
            key={t.id}
            className="group flex items-center gap-2 rounded px-1 py-1.5 hover:bg-pf-900/50"
          >
            <button
              onClick={() =>
                toggleTodo.mutate({ todo: t, completed: !t.completed })
              }
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-400 focus-visible:ring-offset-1 focus-visible:ring-offset-pf-950",
                t.completed
                  ? "border-pf-400 bg-pf-400 text-white"
                  : "border-pf-700 hover:border-pf-400"
              )}
            >
              {t.completed && (
                <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none">
                  <path
                    d="M2 6l3 3 5-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                t.completed
                  ? "text-pf-700 line-through"
                  : "text-pf-100"
              )}
            >
              {t.content}
            </span>
            <button
              onClick={() => deleteTodo.mutate(t.id)}
              className="rounded p-0.5 text-pf-900 opacity-0 hover:text-red-400 group-hover:opacity-100"
              title="Delete"
            >
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>

      {/* Add new */}
      <div className="mt-2 flex items-center gap-1">
        <button
          onClick={handleAdd}
          className="rounded p-1 text-pf-700 hover:bg-pf-900 hover:text-pf-400"
          title="Add checklist item"
        >
          <Plus size={14} />
        </button>
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="Add a checklist item…"
          className="flex-1 bg-transparent text-sm text-pf-100 outline-none placeholder-pf-900"
        />
      </div>
    </div>
  );
}