import api from "@/lib/axios";
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

// ----- Projects -----
export const projectsApi = {
  list: () => api.get<Project[]>("/projects").then((r) => r.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (data: Partial<Project>) =>
    api.post<Project>("/projects", data).then((r) => r.data),
  update: (id: string, data: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// ----- Statuses -----
export const statusesApi = {
  list: () => api.get<Status[]>("/statuses").then((r) => r.data),
  create: (data: Partial<Status>) =>
    api.post<Status>("/statuses", data).then((r) => r.data),
  update: (id: string, data: Partial<Status>) =>
    api.patch<Status>(`/statuses/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/statuses/${id}`),
};

// ----- Tags -----
export const tagsApi = {
  list: () => api.get<Tag[]>("/tags").then((r) => r.data),
  create: (data: Partial<Tag>) => api.post<Tag>("/tags", data).then((r) => r.data),
  update: (id: string, data: Partial<Tag>) =>
    api.patch<Tag>(`/tags/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/tags/${id}`),
};

// ----- Tasks -----
export const tasksApi = {
  list: (params?: { project_id?: string; status_id?: string }) =>
    api.get<Task[]>("/tasks", { params }).then((r) => r.data),
  cards: (project_id?: string) =>
    api
      .get<TaskCard[]>("/tasks/cards", { params: { project_id } })
      .then((r) => r.data),
  get: (id: string) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
  create: (data: TaskCreateInput) =>
    api.post<Task>("/tasks", data).then((r) => r.data),
  update: (id: string, data: TaskUpdateInput) =>
    api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),
  move: (id: string, data: TaskMoveInput) =>
    api.post<Task>(`/tasks/${id}/move`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  addNote: (task_id: string, content: string) =>
    api.post<Note>(`/tasks/${task_id}/notes`, { content }).then((r) => r.data),
  addMicroTodo: (task_id: string, content: string) =>
    api
      .post<MicroTodo>(`/tasks/${task_id}/microtodos`, {
        content,
        completed: false,
        position: 0,
      })
      .then((r) => r.data),
};

// ----- Notes -----
export const notesApi = {
  update: (id: string, content: string) =>
    api.patch<Note>(`/notes/${id}`, { content }).then((r) => r.data),
  delete: (id: string) => api.delete(`/notes/${id}`),
};

// ----- Micro todos -----
export const microTodosApi = {
  update: (id: string, data: { content?: string; completed?: boolean; position?: number }) =>
    api.patch<MicroTodo>(`/microtodos/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/microtodos/${id}`),
};

// ----- Webhooks (testing helpers) -----
export const webhooksApi = {
  git: (payload: Record<string, unknown>, secret: string) =>
    api
      .post("/webhooks/git", payload, {
        headers: { "X-ProjectFlow-Webhook-Secret": secret },
      })
      .then((r) => r.data),
  deploy: (payload: Record<string, unknown>, secret: string) =>
    api
      .post("/webhooks/deploy", payload, {
        headers: { "X-ProjectFlow-Webhook-Secret": secret },
      })
      .then((r) => r.data),
};