import { Sidebar } from "@/components/layouts/Sidebar";
import { KanbanBoard } from "@/features/board/components/KanbanBoard";
import { CommandPalette } from "@/features/board/components/CommandPalette";
import { TaskDetail } from "@/features/board/components/TaskDetail";
import { useGlobalHotkeys } from "@/hooks/useHotkeys";
import { useUIStore } from "@/features/board/store/uiStore";
import { useEffect } from "react";

export default function BoardPage() {
  const toggleCommand = useUIStore((s) => s.toggleCommand);

  useGlobalHotkeys({
    onNewTask: () => toggleCommand(),
  });

  // Suppress browser default for Cmd+K
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", block, true);
    return () => window.removeEventListener("keydown", block, true);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#041421]">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <KanbanBoard />
      </main>
      <CommandPalette />
      <TaskDetail />
    </div>
  );
}