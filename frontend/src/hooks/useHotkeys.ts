import { useEffect } from "react";
import { useUIStore } from "@/features/board/store/uiStore";

interface HotkeyOptions {
  onMoveStatus?: (direction: -1 | 1) => void;
  onDeleteSelected?: () => void;
  onEscape?: () => void;
  onNewTask?: () => void;
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

/**
 * Global keyboard shortcuts:
 *  - Cmd/Ctrl+K  → open command palette
 *  - "n"         → new task (when not typing)
 *  - "m"         → move selected task to next status
 *  - "M" (shift+m) → move to previous status
 *  - "/"         → focus search
 *  - Esc         → close any open panel
 */
export function useGlobalHotkeys(opts: HotkeyOptions = {}) {
  const toggleCommand = useUIStore((s) => s.toggleCommand);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const closeDetail = useUIStore((s) => s.closeDetail);
  const detailTaskId = useUIStore((s) => s.detailTaskId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K → command palette (always)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommand();
        return;
      }

      // Esc → close detail / command
      if (e.key === "Escape") {
        if (detailTaskId) {
          closeDetail();
          e.preventDefault();
          return;
        }
        setCommandOpen(false);
        opts.onEscape?.();
        return;
      }

      // Don't trigger single-key hotkeys while typing
      if (isEditable(e.target)) return;

      // "n" → new task
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        opts.onNewTask?.();
        return;
      }

      // "m" → move status forward, "M" → backward
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        opts.onMoveStatus?.(e.key === "m" ? 1 : -1);
        return;
      }

      // "/" → focus search
      if (e.key === "/") {
        e.preventDefault();
        setSearchQuery("");
        setCommandOpen(true);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCommand, setCommandOpen, setSearchQuery, closeDetail, detailTaskId, opts]);
}