"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, Clock, CheckCircle2, PlusCircle, Loader2 } from "lucide-react";
import type { Todo, WeeklyData } from "@/types";
import { api } from "@/lib/api";

const priorityConfig = {
  high: { label: "높음", color: "bg-red-100 text-red-700" },
  medium: { label: "보통", color: "bg-yellow-100 text-yellow-700" },
  low: { label: "낮음", color: "bg-green-100 text-green-700" },
};

function WeeklyTodoItem({ todo, onEdit }: { todo: Todo; onEdit: (todo: Todo) => void }) {
  const isOverdue = todo.due_date && !todo.is_completed && new Date(todo.due_date) < new Date();

  return (
    <div
      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm cursor-pointer transition-shadow"
      onClick={() => onEdit(todo)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {todo.task_type && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: todo.task_type.color + "20", color: todo.task_type.color }}
            >
              {todo.task_type.name}
            </span>
          )}
          <Badge variant="outline" className={`text-xs ${priorityConfig[todo.priority].color}`}>
            {priorityConfig[todo.priority].label}
          </Badge>
        </div>
        <h4 className={`text-sm font-medium ${todo.is_completed ? "line-through text-gray-400" : "text-gray-900"}`}>
          {todo.title}
        </h4>
        {todo.due_date && (
          <p className={`text-xs mt-1 ${isOverdue ? "text-red-500" : "text-gray-500"}`}>
            {new Date(todo.due_date).toLocaleDateString("ko-KR", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        )}
      </div>
      <div className="flex gap-1">
        {todo.tags.map((tag) => (
          <span
            key={tag.id}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: tag.color }}
            title={tag.name}
          />
        ))}
      </div>
    </div>
  );
}

interface WeeklySectionProps {
  title: string;
  icon: React.ReactNode;
  todos: Todo[];
  emptyMessage: string;
  onEdit: (todo: Todo) => void;
}

function WeeklySection({ title, icon, todos, emptyMessage, onEdit }: WeeklySectionProps) {
  return (
    <div className="bg-gray-50 rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
          {todos.length}
        </span>
      </div>
      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{emptyMessage}</p>
        ) : (
          todos.map((todo) => <WeeklyTodoItem key={todo.id} todo={todo} onEdit={onEdit} />)
        )}
      </div>
    </div>
  );
}

interface WeeklyBoardProps {
  onEditTodo: (todo: Todo) => void;
}

export function WeeklyBoard({ onEditTodo }: WeeklyBoardProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchWeekly = async () => {
    setLoading(true);
    try {
      const dateStr = currentDate.toISOString().split("T")[0];
      const data = await api.getWeeklyTodos(dateStr);
      setWeeklyData(data);
    } catch (err) {
      console.error("Failed to fetch weekly data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekly();
  }, [currentDate]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const goToThisWeek = () => setCurrentDate(new Date());

  const formatWeekRange = () => {
    if (!weeklyData) return "";
    const start = new Date(weeklyData.week_start);
    const end = new Date(weeklyData.week_end);
    return `${start.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} - ${end.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold text-gray-700 min-w-[240px] text-center">
            {formatWeekRange()}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToThisWeek}>
          이번 주
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeeklySection
          title="오늘 할 일"
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          todos={weeklyData?.today || []}
          emptyMessage="오늘 할 일이 없습니다"
          onEdit={onEditTodo}
        />
        <WeeklySection
          title="지연됨"
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          todos={weeklyData?.overdue || []}
          emptyMessage="지연된 일이 없습니다"
          onEdit={onEditTodo}
        />
        <WeeklySection
          title="진행 중"
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
          todos={weeklyData?.in_progress || []}
          emptyMessage="진행 중인 일이 없습니다"
          onEdit={onEditTodo}
        />
        <WeeklySection
          title="이번 주 완료"
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          todos={weeklyData?.completed_this_week || []}
          emptyMessage="이번 주 완료한 일이 없습니다"
          onEdit={onEditTodo}
        />
        <WeeklySection
          title="이번 주 추가된 일"
          icon={<PlusCircle className="h-5 w-5 text-purple-500" />}
          todos={weeklyData?.added_this_week || []}
          emptyMessage="이번 주 추가된 일이 없습니다"
          onEdit={onEditTodo}
        />
      </div>
    </div>
  );
}
