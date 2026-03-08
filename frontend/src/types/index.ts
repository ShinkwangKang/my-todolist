export type Priority = "high" | "medium" | "low";
export type Category = "work" | "personal";

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface TaskType {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  category: Category;
  task_type_id: number | null;
  task_type: TaskType | null;
  priority: Priority;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  column_id: number;
  position: number;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: number;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
  todos: Todo[];
}

export interface WeeklyData {
  today: Todo[];
  added_this_week: Todo[];
  in_progress: Todo[];
  completed_this_week: Todo[];
  overdue: Todo[];
  week_start: string;
  week_end: string;
}
