import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { CommandPalette } from "@/components/CommandPalette";
import { TaskDetail } from "@/components/TaskDetail";
import { useGlobalHotkeys } from "@/hooks/useHotkeys";
import { useUIStore } from "@/stores/uiStore";

export default function App() {
  const toggleCommand = useUIStore((s) => s.toggleCommand);

  useGlobalHotkeys({
    onNewTask: () => toggleCommand(),
  });

  // Suppress browser default for Cmd+K (some browsers focus the search bar)
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
    <div className="flex h-screen w-screen overflow-hidden bg-ink-950">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <KanbanBoard />
      </main>
      <CommandPalette />
      <TaskDetail />
    </div>
  );
}
