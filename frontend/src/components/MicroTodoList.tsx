import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MicroTodo as MicroTodoType } from "@/types";
import {
  useAddMicroTodo,
  useDeleteMicroTodo,
  useToggleMicroTodo,
} from "@/hooks/useApi";

interface Props {
  taskId: string;
  todos: MicroTodoType[];
}

export function MicroTodoList({ taskId, todos }: Props) {
  const [newText, setNewText] = useState("");
  const addTodo = useAddMicroTodo();
  const toggleTodo = useToggleMicroTodo();
  const deleteTodo = useDeleteMicroTodo();

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    await addTodo.mutateAsync({ taskId, content: text });
    setNewText("");
  };

  const total = todos.length;
  const done = todos.filter((t) => t.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      {/* Header + progress */}
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          Checklist
        </h4>
        {total > 0 && (
          <span className="text-[10px] text-ink-500">
            {done}/{total} · {pct}%
          </span>
        )}
      </div>
      {total > 0 && (
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-ink-800">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Existing items */}
      <ul className="space-y-1">
        {todos.map((t) => (
          <li
            key={t.id}
            className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-ink-800/50"
          >
            <button
              onClick={() =>
                toggleTodo.mutate({ todo: t, completed: !t.completed })
              }
              className={cn(
                "grid h-4 w-4 shrink-0 place-items-center rounded border transition",
                t.completed
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-ink-600 hover:border-ink-400"
              )}
            >
              {t.completed && (
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
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
                  ? "text-ink-500 line-through"
                  : "text-ink-200"
              )}
            >
              {t.content}
            </span>
            <button
              onClick={() => deleteTodo.mutate(t.id)}
              className="rounded p-0.5 text-ink-600 opacity-0 hover:text-red-400 group-hover:opacity-100"
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
          className="rounded p-1 text-ink-500 hover:bg-ink-800 hover:text-ink-300"
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
          className="flex-1 bg-transparent text-sm text-ink-200 outline-none placeholder-ink-600"
        />
      </div>
    </div>
  );
}
