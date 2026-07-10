import { useMemo } from "react";
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
import { useStatuses, useTaskCards, useMoveTask } from "@/hooks/useApi";
import { useUIStore } from "@/stores/uiStore";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import type { TaskCard as TaskCardType } from "@/types";

export function KanbanBoard() {
  const { data: statuses, isLoading: statusesLoading } = useStatuses();
  const { data: cards, isLoading: cardsLoading } = useTaskCards();
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

  // Filter cards by search query
  const filteredCards = useMemo(() => {
    if (!cards) return [];
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.toLowerCase();
    return cards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.tags.some((t) => t.name.toLowerCase().includes(q))
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

  const handleDragEnd = (event: DragEndEvent) => {
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
      const overTask = (cards ?? []).find((c) => c.id === overId);
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
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-sm text-ink-500">Loading board…</div>
      </div>
    );
  }

  if (!statuses || statuses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <KanbanSquare size={32} className="mx-auto mb-2 text-ink-600" />
          <p className="text-sm text-ink-400">No statuses defined.</p>
          <p className="text-xs text-ink-500">
            The backend should seed default statuses on first boot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Board header */}
      <div className="flex h-14 items-center gap-3 border-b border-ink-800 px-4">
        <h2 className="text-sm font-semibold text-ink-100">
          {activeProject ? activeProject.name : "All Projects"}
        </h2>
        {activeProject?.description && (
          <span className="hidden truncate text-xs text-ink-500 md:block">
            {activeProject.description}
          </span>
        )}
        <div className="relative ml-auto">
          <Search
            size={13}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-500"
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
        onDragEnd={handleDragEnd}
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
          {/* Optional floating preview — empty here since the card already
              shows at low opacity during drag. */}
          {null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
