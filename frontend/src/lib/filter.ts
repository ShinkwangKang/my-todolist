import type { Todo, Priority, Category } from "@/types";

export interface Filters {
  search: string;
  priorities: Priority[];
  categories: Category[];
  taskTypeIds: number[];
  tagIds: number[];
}

export const emptyFilters: Filters = {
  search: "",
  priorities: [],
  categories: [],
  taskTypeIds: [],
  tagIds: [],
};

export function isFiltersActive(filters: Filters): boolean {
  return (
    filters.search.length > 0 ||
    filters.priorities.length > 0 ||
    filters.categories.length > 0 ||
    filters.taskTypeIds.length > 0 ||
    filters.tagIds.length > 0
  );
}

export function countActiveFilters(filters: Filters): number {
  let count = 0;
  if (filters.search.length > 0) count++;
  count += filters.priorities.length;
  count += filters.categories.length;
  count += filters.taskTypeIds.length;
  count += filters.tagIds.length;
  return count;
}

export function filterTodos(todos: Todo[], filters: Filters): Todo[] {
  return todos.filter((todo) => {
    // Text search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const titleMatch = todo.title.toLowerCase().includes(q);
      const descMatch = todo.description?.toLowerCase().includes(q) ?? false;
      if (!titleMatch && !descMatch) return false;
    }

    // Priority filter
    if (filters.priorities.length > 0 && !filters.priorities.includes(todo.priority)) {
      return false;
    }

    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(todo.category)) {
      return false;
    }

    // Task type filter
    if (filters.taskTypeIds.length > 0) {
      if (!todo.task_type_id || !filters.taskTypeIds.includes(todo.task_type_id)) {
        return false;
      }
    }

    // Tag filter
    if (filters.tagIds.length > 0) {
      const todoTagIds = todo.tags.map((t) => t.id);
      if (!filters.tagIds.some((id) => todoTagIds.includes(id))) {
        return false;
      }
    }

    return true;
  });
}
