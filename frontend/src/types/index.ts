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

export interface DailyProgress {
  id: number;
  todo_id: number;
  date: string;
  content: string;
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
  start_date: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  column_id: number;
  position: number;
  tags: Tag[];
  daily_progress?: DailyProgress[];
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
  mon: Todo[];
  tue: Todo[];
  wed: Todo[];
  thu: Todo[];
  fri: Todo[];
  weekend: Todo[];
  week_start: string;
  week_end: string;
}
