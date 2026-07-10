import { create } from "zustand";
import type { Project } from "@/types";

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Active project filter (null = "All Projects")
  activeProjectId: string | null;
  setActiveProject: (id: string | null) => void;

  // Active project object (cached for header display)
  activeProject: Project | null;
  setActiveProjectObj: (p: Project | null) => void;

  // Command palette
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;

  // Task detail drawer
  detailTaskId: string | null;
  openDetail: (id: string) => void;
  closeDetail: () => void;

  // Quick-add popover (per column)
  quickAddStatusId: string | null;
  setQuickAdd: (statusId: string | null) => void;

  // Search query (filters cards by title)
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),

  activeProject: null,
  setActiveProjectObj: (p) => set({ activeProject: p }),

  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),

  detailTaskId: null,
  openDetail: (id) => set({ detailTaskId: id }),
  closeDetail: () => set({ detailTaskId: null }),

  quickAddStatusId: null,
  setQuickAdd: (statusId) => set({ quickAddStatusId: statusId }),

  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
}));