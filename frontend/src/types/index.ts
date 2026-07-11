// Shared TypeScript types mirroring the FastAPI Pydantic schemas.

export interface Status {
  id: string;
  name: string;
  position: number;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MicroTodo {
  id: string;
  task_id: string;
  content: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  status_id: string;
  title: string;
  description: string | null;
  position: number;
  priority: number; // 0=low, 1=med, 2=high, 3=urgent
  due_date: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  notes: Note[];
  micro_todos: MicroTodo[];
}

export interface TaskCard {
  id: string;
  title: string;
  status_id: string;
  project_id: string;
  position: number;
  priority: number;
  description: string | null;
  due_date: string | null;
  tags: Tag[];
  micro_todo_total: number;
  micro_todo_done: number;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
  position: number;
  created_at: string;
  updated_at: string;
  task_count: number;
}

export type TaskCreateInput = {
  project_id: string;
  title: string;
  description?: string | null;
  status_id?: string;
  position?: number;
  priority?: number;
  due_date?: string | null;
  tag_ids?: string[];
};

export type TaskUpdateInput = {
  title?: string;
  description?: string | null;
  status_id?: string;
  project_id?: string;
  position?: number;
  priority?: number;
  due_date?: string | null;
  tag_ids?: string[];
};

export type TaskMoveInput = {
  status_id?: string;
  position?: number;
  project_id?: string;
};

export const PRIORITY_LABELS = ["Low", "Medium", "High", "Urgent"] as const;
export const PRIORITY_COLORS = [
  "#64748b",
  "#0ea5e9",
  "#f59e0b",
  "#ef4444",
] as const;

export const PROJECT_STATUSES = [
  { name: "Planning", color: "#8b5cf6" },
  { name: "Yet to Start", color: "#64748b" },
  { name: "In Process", color: "#0ea5e9" },
  { name: "Blocked", color: "#ef4444" },
  { name: "Finished", color: "#22c55e" },
] as const;
