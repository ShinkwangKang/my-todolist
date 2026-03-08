"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Loader2, MoveRight } from "lucide-react";
import { TodoCard } from "@/components/Card/TodoCard";
import type { Todo, WeeklyData } from "@/types";
import { api } from "@/lib/api";

// Day column keys and labels
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "weekend"] as const;
type DayKey = (typeof DAY_KEYS)[number];

const DAY_LABELS: Record<DayKey, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  weekend: "주말",
};

// Returns the Date object for each day column given week_start (Monday)
function getDayDates(weekStart: Date): Record<DayKey, Date> {
  return {
    mon: new Date(weekStart.getTime() + 0 * 86400000),
    tue: new Date(weekStart.getTime() + 1 * 86400000),
    wed: new Date(weekStart.getTime() + 2 * 86400000),
    thu: new Date(weekStart.getTime() + 3 * 86400000),
    fri: new Date(weekStart.getTime() + 4 * 86400000),
    weekend: new Date(weekStart.getTime() + 5 * 86400000), // Saturday
  };
}

function formatDayHeader(dayKey: DayKey, dayDate: Date): string {
  const label = DAY_LABELS[dayKey];
  const month = dayDate.getMonth() + 1;
  const day = dayDate.getDate();
  return `${label} ${month}/${day}`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isThisWeekend(weekStart: Date): boolean {
  const now = new Date();
  const sat = new Date(weekStart.getTime() + 5 * 86400000);
  const sun = new Date(weekStart.getTime() + 6 * 86400000);
  return (
    (now.getFullYear() === sat.getFullYear() &&
      now.getMonth() === sat.getMonth() &&
      now.getDate() === sat.getDate()) ||
    (now.getFullYear() === sun.getFullYear() &&
      now.getMonth() === sun.getMonth() &&
      now.getDate() === sun.getDate())
  );
}

// A todo is a carryover if it appears in this column but its start_date day != this column's day
function isCarryover(todo: Todo, dayKey: DayKey, weekStart: Date): boolean {
  if (!todo.start_date) return false;
  const start = new Date(todo.start_date);
  const dayDates = getDayDates(weekStart);
  const colDate = dayDates[dayKey];

  if (dayKey === "weekend") {
    const sat = colDate;
    const sun = new Date(weekStart.getTime() + 6 * 86400000);
    const startDay = start.toDateString();
    return startDay !== sat.toDateString() && startDay !== sun.toDateString();
  }
  return start.toDateString() !== colDate.toDateString();
}

// Build start_date ISO string for the given day column (noon time)
function buildStartDate(dayKey: DayKey, weekStart: Date): string {
  const dayDates = getDayDates(weekStart);
  const date = dayDates[dayKey];
  // Use noon (12:00) as default time
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

interface WeekDayColumnProps {
  dayKey: DayKey;
  dayDate: Date;
  weekStart: Date;
  todos: Todo[];
  isCurrentDay: boolean;
  onEditTodo: (todo: Todo) => void;
  onDeleteTodo: (id: number) => void;
  onAddTodo: (dayKey: DayKey) => void;
}

function WeekDayColumn({
  dayKey,
  dayDate,
  weekStart,
  todos,
  isCurrentDay,
  onEditTodo,
  onDeleteTodo,
  onAddTodo,
}: WeekDayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayKey}`,
    data: { type: "day", dayKey },
  });

  return (
    <div
      className={`flex flex-col w-72 min-w-[288px] rounded-lg border border-border bg-muted/50 ${
        isCurrentDay
          ? "border-t-4 border-t-blue-500 ring-1 ring-blue-200"
          : "border-t-4 border-t-gray-300"
      } ${isOver ? "ring-2 ring-blue-300 bg-blue-50/30" : ""}`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 p-3 pb-2">
        <h2
          className={`font-semibold ${
            isCurrentDay ? "text-blue-600" : "text-foreground"
          }`}
        >
          {formatDayHeader(dayKey, dayDate)}
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {todos.length}
        </span>
        {isCurrentDay && (
          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full ml-auto">
            오늘
          </span>
        )}
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2 pt-0 space-y-2 min-h-[100px]"
      >
        <SortableContext
          items={todos.map((t) => `todo-${t.id}-${dayKey}`)}
          strategy={verticalListSortingStrategy}
        >
          {todos.map((todo) => {
            const carryover = isCarryover(todo, dayKey, weekStart);
            return (
              <div
                key={`${todo.id}-${dayKey}`}
                className={`relative ${carryover ? "opacity-60" : ""}`}
              >
                {carryover && (
                  <div className="absolute -top-1 -right-1 z-10 bg-orange-400 rounded-full p-0.5">
                    <MoveRight className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                <TodoCard
                  todo={todo}
                  onEdit={onEditTodo}
                  onDelete={onDeleteTodo}
                />
              </div>
            );
          })}
        </SortableContext>

        {/* Add card button */}
        <button
          onClick={() => onAddTodo(dayKey)}
          className="w-full flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

interface WeeklyBoardProps {
  onEditTodo: (todo: Todo) => void;
  onAddTodo?: (defaultDueDate?: string) => void;
  onRefresh?: () => void;
  columns?: import("@/types").Column[];
  projectId?: number;
}

export function WeeklyBoard({ onEditTodo, onAddTodo, onRefresh, columns, projectId }: WeeklyBoardProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);
  const [activeDayKey, setActiveDayKey] = useState<DayKey | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchWeekly = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = currentDate.toISOString().split("T")[0];
      const data = await api.getWeeklyTodos(dateStr, projectId);
      setWeeklyData(data);
    } catch (err) {
      console.error("Failed to fetch weekly data:", err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, projectId]);

  useEffect(() => {
    fetchWeekly();
  }, [fetchWeekly]);

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

  const handleAddTodoForDay = (dayKey: DayKey) => {
    if (!weeklyData) return;
    const weekStart = new Date(weeklyData.week_start);
    const startDate = buildStartDate(dayKey, weekStart);
    if (onAddTodo) {
      onAddTodo(startDate);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await api.deleteTodo(id);
      fetchWeekly();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "todo") {
      setActiveTodo(active.data.current.todo);
      setActiveDayKey(active.data.current.dayKey ?? null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTodo(null);
    setActiveDayKey(null);

    if (!over || !weeklyData) return;

    const overId = String(over.id);
    let targetDayKey: DayKey | null = null;

    if (overId.startsWith("day-")) {
      targetDayKey = overId.replace("day-", "") as DayKey;
    } else if (overId.startsWith("todo-")) {
      // Find which day column the target card is in
      for (const key of DAY_KEYS) {
        const todos = weeklyData[key];
        const found = todos.find((t) => `todo-${t.id}-${key}` === overId);
        if (found) {
          targetDayKey = key;
          break;
        }
      }
    }

    if (!targetDayKey) return;

    // Extract todo id from active id (format: "todo-{id}-{dayKey}")
    const activeIdStr = String(active.id);
    const parts = activeIdStr.split("-");
    const todoId = Number(parts[1]);
    if (!todoId) return;

    const weekStart = new Date(weeklyData.week_start);
    const newStartDate = buildStartDate(targetDayKey, weekStart);

    try {
      await api.updateTodo(todoId, { start_date: newStartDate });
      fetchWeekly();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to update due_date:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const weekStart = weeklyData ? new Date(weeklyData.week_start) : new Date();
  const dayDates = getDayDates(weekStart);

  return (
    <div className="px-4 pb-4">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold text-foreground min-w-[240px] text-center">
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

      {/* Day columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {DAY_KEYS.map((dayKey) => {
            const dayDate = dayDates[dayKey];
            const todos = weeklyData?.[dayKey] ?? [];
            const currentDay =
              dayKey === "weekend"
                ? isThisWeekend(weekStart)
                : isToday(dayDate);

            return (
              <WeekDayColumn
                key={dayKey}
                dayKey={dayKey}
                dayDate={dayDate}
                weekStart={weekStart}
                todos={todos}
                isCurrentDay={currentDay}
                onEditTodo={onEditTodo}
                onDeleteTodo={handleDeleteTodo}
                onAddTodo={handleAddTodoForDay}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTodo ? (
            <div className="rotate-2 opacity-90">
              <TodoCard todo={activeTodo} onEdit={() => {}} onDelete={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
