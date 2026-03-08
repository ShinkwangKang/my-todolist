const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Columns
export const api = {
  getColumns: () => request<import("@/types").Column[]>("/api/columns"),
  createColumn: (title: string) =>
    request<import("@/types").Column>("/api/columns", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  updateColumn: (id: number, title: string) =>
    request<import("@/types").Column>(`/api/columns/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title }),
    }),
  deleteColumn: (id: number) =>
    request<void>(`/api/columns/${id}`, { method: "DELETE" }),
  reorderColumns: (columnIds: number[]) =>
    request<void>("/api/columns/reorder", {
      method: "PUT",
      body: JSON.stringify({ column_ids: columnIds }),
    }),

  // Todos
  getTodos: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<import("@/types").Todo[]>(`/api/todos${query}`);
  },
  getWeeklyTodos: (date?: string) => {
    const query = date ? `?date=${date}` : "";
    return request<import("@/types").WeeklyData>(`/api/todos/weekly${query}`);
  },
  getWeeklyReport: (date?: string) => {
    const query = date ? `?date=${date}` : "";
    return request<import("@/types").WeeklyReportData>(`/api/todos/weekly-report${query}`);
  },
  createTodo: (data: {
    title: string;
    description?: string;
    category?: string;
    task_type_id?: number;
    priority?: string;
    start_date?: string;
    due_date?: string;
    column_id: number;
    tag_ids?: number[];
  }) =>
    request<import("@/types").Todo>("/api/todos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTodo: (id: number, data: Record<string, unknown>) =>
    request<import("@/types").Todo>(`/api/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteTodo: (id: number) =>
    request<void>(`/api/todos/${id}`, { method: "DELETE" }),
  moveTodo: (id: number, columnId: number, position: number) =>
    request<import("@/types").Todo>(`/api/todos/${id}/move`, {
      method: "PUT",
      body: JSON.stringify({ column_id: columnId, position }),
    }),

  // Tags
  getTags: () => request<import("@/types").Tag[]>("/api/tags"),
  createTag: (data: { name: string; color: string }) =>
    request<import("@/types").Tag>("/api/tags", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTag: (id: number, data: { name: string; color: string }) =>
    request<import("@/types").Tag>(`/api/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteTag: (id: number) =>
    request<void>(`/api/tags/${id}`, { method: "DELETE" }),

  // Task Types
  getTaskTypes: () =>
    request<import("@/types").TaskType[]>("/api/task-types"),
  createTaskType: (data: { name: string; color: string; icon?: string }) =>
    request<import("@/types").TaskType>("/api/task-types", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTaskType: (
    id: number,
    data: { name: string; color: string; icon?: string }
  ) =>
    request<import("@/types").TaskType>(`/api/task-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteTaskType: (id: number) =>
    request<void>(`/api/task-types/${id}`, { method: "DELETE" }),

  // Daily Progress
  getDailyProgress: (todoId: number) =>
    request<import("@/types").DailyProgress[]>(`/api/todos/${todoId}/daily-progress`),
  upsertDailyProgress: (todoId: number, date: string, content: string) =>
    request<import("@/types").DailyProgress>(`/api/todos/${todoId}/daily-progress/${date}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
  deleteDailyProgress: (todoId: number, date: string) =>
    request<void>(`/api/todos/${todoId}/daily-progress/${date}`, { method: "DELETE" }),
};
