import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCorners,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanSquare, Search } from "lucide-react";
import { useStatuses, useTaskCards, useMoveTask } from "@/features/board/api/hooks";
import { useUIStore } from "@/features/board/store/uiStore";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import type { TaskCard as TaskCardType } from "@/types";
import { PRIORITY_COLORS } from "@/types";

export function KanbanBoard() {
  const { data: rawStatuses, isLoading: statusesLoading } = useStatuses();
  const { data: rawCards, isLoading: cardsLoading } = useTaskCards();
  const statuses = Array.isArray(rawStatuses) ? rawStatuses : [];
  const cards = Array.isArray(rawCards) ? rawCards : [];
  const moveTask = useMoveTask();
  const activeProject = useUIStore((s) => s.activeProject);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  // Filter cards by search query
  const filteredCards = useMemo(() => {
    if (!cards.length) return [];
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.toLowerCase();
    return cards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.name.toLowerCase().includes(q))
    );
  }, [cards, searchQuery]);

  // Group by status
  const grouped = useMemo(() => {
    const map = new Map<string, TaskCardType[]>();
    for (const s of statuses ?? []) map.set(s.id, []);
    for (const c of filteredCards) {
      const arr = map.get(c.status_id);
      if (arr) arr.push(c);
    }
    // Sort each group by position
    for (const arr of map.values()) arr.sort((a, b) => a.position - b.position);
    return map;
  }, [filteredCards, statuses]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeTask = active.data.current?.task as TaskCardType | undefined;
    if (!activeTask) return;

    // Determine destination status + position
    let destStatusId: string;
    let destPosition: number;

    if (overId.startsWith("column-")) {
      // Dropped onto empty column area
      destStatusId = over.data.current?.statusId as string;
      const col = grouped.get(destStatusId) ?? [];
      destPosition = col.length;
    } else {
      // Dropped over a card — recompute based on over card's position
      const overTask = cards.find((c) => c.id === overId);
      if (!overTask) return;
      destStatusId = overTask.status_id;
      const col = grouped.get(destStatusId) ?? [];
      const overIndex = col.findIndex((c) => c.id === overId);
      destPosition = overIndex >= 0 ? overIndex : col.length;
    }

    if (
      destStatusId === activeTask.status_id &&
      destPosition === activeTask.position
    ) {
      return; // No-op
    }

    moveTask.mutate({
      id: activeId,
      data: { status_id: destStatusId, position: destPosition },
    });
  };

  if (statusesLoading || cardsLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b border-pf-border px-4">
          <div className="h-4 w-32 animate-pulse rounded bg-pf-surface" />
        </div>
        <div className="flex flex-1 gap-3 overflow-x-auto p-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-72 shrink-0 space-y-2">
              <div className="mb-2 flex items-center gap-2 px-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-pf-surface" />
                <div className="h-3 w-16 animate-pulse rounded bg-pf-surface" />
              </div>
              {[1, 2, 3].map((j) => (
                <div key={j} className="pf-card animate-pulse p-2.5">
                  <div className="h-4 w-3/4 rounded bg-pf-950" />
                  <div className="mt-2 h-3 w-full rounded bg-pf-950" />
                  <div className="mt-1 h-3 w-2/3 rounded bg-pf-950" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <KanbanSquare size={32} className="mx-auto mb-2 text-pf-700" />
          <p className="text-sm text-pf-700">No statuses defined.</p>
          <p className="text-xs text-pf-muted-fg">
            The backend should seed default statuses on first boot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Board header */}
      <div className="flex h-14 items-center gap-3 border-b border-pf-border px-4">
        <h2 className="text-sm font-semibold text-pf-100">
          {activeProject ? activeProject.name : "All Projects"}
        </h2>
        {activeProject?.description && (
          <span className="hidden truncate text-xs text-pf-700 md:block">
            {activeProject.description}
          </span>
        )}
        <div className="relative ml-auto">
          <Search
            size={13}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-pf-700"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter…"
            className="pf-input h-8 w-40 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-1 gap-3 overflow-x-auto p-3">
          {statuses.map((status) => (
            <TaskColumn
              key={status.id}
              status={status}
              tasks={grouped.get(status.id) ?? []}
              statuses={statuses}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (() => {
            const task = filteredCards.find((c) => c.id === activeId);
            if (!task) return null;
            const status = statuses.find((s) => s.id === task.status_id);
            return (
              <div className="pf-card w-72 p-2.5 shadow-2xl ring-2 ring-pf-400/50 rotate-2 opacity-90">
                <div
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
                  style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                />
                <h4 className="px-1 text-sm font-medium leading-snug text-pf-100">
                  {task.title}
                </h4>
                {task.description && (
                  <p className="mt-1 line-clamp-2 px-1 text-xs text-pf-700">
                    {task.description.replace(/[#*`>\-_~]/g, "").slice(0, 120)}
                  </p>
                )}
                {(task.tags ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 px-1">
                    {(task.tags ?? []).map((tag) => (
                      <span
                        key={tag.id}
                        className="pf-tag"
                        style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                {status && (
                  <div className="mt-2 flex items-center gap-1 px-1 text-[10px] text-pf-700">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                    {status.name}
                  </div>
                )}
              </div>
            );
          })() : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}