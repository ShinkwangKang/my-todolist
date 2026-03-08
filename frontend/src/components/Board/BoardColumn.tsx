"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, AlertTriangle, Archive } from "lucide-react";
import { TodoCard } from "@/components/Card/TodoCard";
import type { Column, Todo } from "@/types";

const columnColors: Record<string, string> = {
  Todo: "border-t-blue-500",
  "In Progress": "border-t-yellow-500",
  Done: "border-t-green-500",
  Cancel: "border-t-gray-400",
};

interface BoardColumnProps {
  column: Column;
  onAddTodo: (columnId: number) => void;
  onEditTodo: (todo: Todo) => void;
  onDeleteTodo: (id: number) => void;
  onArchiveTodo?: (id: number) => void;
  onBulkArchive?: (columnId: number) => void;
}

export function BoardColumn({ column, onAddTodo, onEditTodo, onDeleteTodo, onArchiveTodo, onBulkArchive }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", column },
  });

  const sortedTodos = [...column.todos].sort((a, b) => a.position - b.position);

  const isDoneOrCancel = column.title === "Done" || column.title === "Cancel";
  const overdueCount = isDoneOrCancel
    ? 0
    : column.todos.filter(
        (t) => t.due_date && !t.is_completed && new Date(t.due_date) < new Date()
      ).length;

  return (
    <div
      className={`flex flex-col w-80 min-w-[320px] rounded-lg border border-border border-t-4 bg-muted/50 ${
        columnColors[column.title] || "border-t-gray-300"
      } ${isOver ? "ring-2 ring-blue-300 bg-blue-50/30" : ""}`}
    >
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-foreground">{column.title}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {column.todos.length}
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
              <AlertTriangle className="h-3 w-3" />
              {overdueCount}
            </span>
          )}
        </div>
        {isDoneOrCancel && onBulkArchive && column.todos.length > 0 && (
          <button
            onClick={() => onBulkArchive(column.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="완료된 카드 정리"
          >
            <Archive className="h-3.5 w-3.5" />
            정리
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2 pt-0 space-y-2 min-h-[100px]"
      >
        <SortableContext
          items={sortedTodos.map((t) => `todo-${t.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {sortedTodos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onEdit={onEditTodo}
              onDelete={onDeleteTodo}
              onArchive={onArchiveTodo}
            />
          ))}
        </SortableContext>

        <button
          onClick={() => onAddTodo(column.id)}
          className="w-full flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
