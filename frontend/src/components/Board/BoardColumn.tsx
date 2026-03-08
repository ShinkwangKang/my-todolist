"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
}

export function BoardColumn({ column, onAddTodo, onEditTodo, onDeleteTodo }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", column },
  });

  const sortedTodos = [...column.todos].sort((a, b) => a.position - b.position);

  return (
    <div
      className={`flex flex-col w-80 min-w-[320px] rounded-lg border border-t-4 bg-gray-50 ${
        columnColors[column.title] || "border-t-gray-300"
      } ${isOver ? "ring-2 ring-blue-300 bg-blue-50/30" : ""}`}
    >
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-700">{column.title}</h2>
          <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
            {column.todos.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onAddTodo(column.id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
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
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
