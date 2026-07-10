import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  microTodosApi,
  notesApi,
  projectsApi,
  statusesApi,
  tagsApi,
  tasksApi,
} from "@/api/client";
import type {
  MicroTodo,
  Note,
  Project,
  Status,
  Tag,
  Task,
  TaskCard,
  TaskCreateInput,
  TaskMoveInput,
  TaskUpdateInput,
} from "@/types";
import { useUIStore } from "@/stores/uiStore";

// --------------------------------------------------------------------------- #
// Query keys
// --------------------------------------------------------------------------- #
export const qk = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  statuses: ["statuses"] as const,
  tags: ["tags"] as const,
  tasks: (projectId: string | null) => ["tasks", { projectId }] as const,
  taskCards: (projectId: string | null) => ["task-cards", { projectId }] as const,
  task: (id: string) => ["task", id] as const,
};

// --------------------------------------------------------------------------- #
// Projects
// --------------------------------------------------------------------------- #
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: qk.projects,
    queryFn: projectsApi.list,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) => projectsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.projects });
      qc.invalidateQueries({ queryKey: ["task-cards"] });
    },
  });
}

// --------------------------------------------------------------------------- #
// Statuses
// --------------------------------------------------------------------------- #
export function useStatuses() {
  return useQuery<Status[]>({
    queryKey: qk.statuses,
    queryFn: statusesApi.list,
    staleTime: 5 * 60 * 1000,
  });
}

// --------------------------------------------------------------------------- #
// Tags
// --------------------------------------------------------------------------- #
export function useTags() {
  return useQuery<Tag[]>({
    queryKey: qk.tags,
    queryFn: tagsApi.list,
    staleTime: 60 * 1000,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Tag>) => tagsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tags }),
  });
}

// --------------------------------------------------------------------------- #
// Tasks (Kanban card view)
// --------------------------------------------------------------------------- //
export function useTaskCards() {
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  return useQuery<TaskCard[]>({
    queryKey: qk.taskCards(activeProjectId),
    queryFn: () => tasksApi.cards(activeProjectId ?? undefined),
    // Optimistic UI: refetch aggressively but keep stale data visible
    staleTime: 0,
  });
}

// --------------------------------------------------------------------------- //
// Single task (detail drawer)
// --------------------------------------------------------------------------- //
export function useTask(taskId: string | null) {
  return useQuery<Task>({
    queryKey: qk.task(taskId ?? "none"),
    queryFn: () => tasksApi.get(taskId!),
    enabled: !!taskId,
  });
}

// --------------------------------------------------------------------------- //
// Mutations
// --------------------------------------------------------------------------- //
export function useCreateTask() {
  const qc = useQueryClient();
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  return useMutation({
    mutationFn: (data: TaskCreateInput) => tasksApi.create(data),
    onMutate: async (data) => {
      const key = qk.taskCards(activeProjectId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TaskCard[]>(key);
      if (prev) {
        const optimistic: TaskCard = {
          id: `tmp-${Date.now()}`,
          title: data.title,
          status_id: data.status_id ?? "",
          project_id: data.project_id,
          position: data.position ?? prev.length,
          priority: data.priority ?? 0,
          description: data.description ?? null,
          due_date: data.due_date ?? null,
          tags: [],
          micro_todo_total: 0,
          micro_todo_done: 0,
        };
        qc.setQueryData<TaskCard[]>(key, (old = []) => [...old, optimistic]);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(qk.taskCards(activeProjectId), ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.taskCards(activeProjectId) });
      qc.invalidateQueries({ queryKey: ["task-cards"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdateInput }) =>
      tasksApi.update(id, data),
    onMutate: async ({ id, data }) => {
      const key = qk.taskCards(activeProjectId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TaskCard[]>(key);
      if (prev) {
        qc.setQueryData<TaskCard[]>(key, (old = []) =>
          old.map((t) => (t.id === id ? { ...t, ...data } : t))
        );
      }
      // Also patch detail cache
      const dKey = qk.task(id);
      const dPrev = qc.getQueryData<Task>(dKey);
      if (dPrev) {
        qc.setQueryData<Task>(dKey, { ...dPrev, ...data });
      }
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: qk.taskCards(activeProjectId) });
      qc.invalidateQueries({ queryKey: qk.task(vars.id) });
    },
  });
}

export function useMoveTask() {
  const qc = useQueryClient();
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskMoveInput }) =>
      tasksApi.move(id, data),
    onMutate: async ({ id, data }) => {
      const key = qk.taskCards(activeProjectId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TaskCard[]>(key);
      if (prev) {
        qc.setQueryData<TaskCard[]>(key, (old = []) =>
          old.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status_id: data.status_id ?? t.status_id,
                  position: data.position ?? t.position,
                  project_id: data.project_id ?? t.project_id,
                }
              : t
          )
        );
      }
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.taskCards(activeProjectId) });
      qc.invalidateQueries({ queryKey: ["task-cards"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onMutate: async (id) => {
      const key = qk.taskCards(activeProjectId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TaskCard[]>(key);
      if (prev) {
        qc.setQueryData<TaskCard[]>(key, (old = []) => old.filter((t) => t.id !== id));
      }
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.taskCards(activeProjectId) });
    },
  });
}

// --------------------------------------------------------------------------- //
// Notes
// --------------------------------------------------------------------------- //
export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      tasksApi.addNote(taskId, content),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: qk.task(vars.taskId) });
    },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      notesApi.update(id, content),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["task"] });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["task"] });
    },
  });
}

// --------------------------------------------------------------------------- //
// Micro-todos
// --------------------------------------------------------------------------- //
export function useAddMicroTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      tasksApi.addMicroTodo(taskId, content),
    onMutate: async ({ taskId, content }) => {
      const key = qk.task(taskId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Task>(key);
      if (prev) {
        const optimistic: MicroTodo = {
          id: `tmp-mt-${Date.now()}`,
          task_id: taskId,
          content,
          completed: false,
          position: prev.micro_todos.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        qc.setQueryData<Task>(key, {
          ...prev,
          micro_todos: [...prev.micro_todos, optimistic],
        });
      }
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: qk.task(vars.taskId) });
      qc.invalidateQueries({ queryKey: ["task-cards"] });
    },
  });
}

export function useToggleMicroTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      todo,
      completed,
    }: {
      todo: MicroTodo;
      completed: boolean;
    }) => microTodosApi.update(todo.id, { completed }),
    onMutate: async ({ todo, completed }) => {
      const key = qk.task(todo.task_id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Task>(key);
      if (prev) {
        qc.setQueryData<Task>(key, {
          ...prev,
          micro_todos: prev.micro_todos.map((m) =>
            m.id === todo.id ? { ...m, completed } : m
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.task(ctx.prev.id), ctx.prev);
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: qk.task(vars.todo.task_id) });
      qc.invalidateQueries({ queryKey: ["task-cards"] });
    },
  });
}

export function useDeleteMicroTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => microTodosApi.delete(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["task"] });
      qc.invalidateQueries({ queryKey: ["task-cards"] });
    },
  });
}

// Notes type re-export for convenience
export type { Note };
