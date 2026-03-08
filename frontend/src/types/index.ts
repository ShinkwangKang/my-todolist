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

export interface WeeklyReportSummary {
  total_count: number;
  completed_count: number;
  completion_rate: number;
  new_count: number;
  avg_duration_days: number | null;
}

export interface WeeklyReportData {
  week_start: string;
  week_end: string;
  sections: {
    new_tasks: Todo[];
    carryover_tasks: Todo[];
    completed_tasks: Todo[];
    in_progress_tasks: Todo[];
    cancelled_tasks: Todo[];
  };
  stats: {
    category_stats: Record<string, number>;
    task_type_stats: Record<string, number>;
    priority_stats: Record<string, number>;
  };
  summary: WeeklyReportSummary;
}
