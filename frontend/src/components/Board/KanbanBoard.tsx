"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { BoardColumn } from "./BoardColumn";
import { TodoCard } from "@/components/Card/TodoCard";
import type { Column, Todo } from "@/types";
import { api } from "@/lib/api";

interface KanbanBoardProps {
  columns: Column[];
  onRefresh: () => void;
  onAddTodo: (columnId: number) => void;
  onEditTodo: (todo: Todo) => void;
  onDeleteTodo: (id: number) => void;
}

export function KanbanBoard({
  columns,
  onRefresh,
  onAddTodo,
  onEditTodo,
  onDeleteTodo,
}: KanbanBoardProps) {
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findColumnByTodoId = useCallback(
    (todoId: number) => columns.find((col) => col.todos.some((t) => t.id === todoId)),
    [columns]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "todo") {
      setActiveTodo(active.data.current.todo);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTodo(null);

    if (!over) return;

    const activeId = Number(String(active.id).replace("todo-", ""));
    let targetColumnId: number;
    let targetPosition: number;

    if (String(over.id).startsWith("column-")) {
      targetColumnId = Number(String(over.id).replace("column-", ""));
      const targetColumn = columns.find((c) => c.id === targetColumnId);
      targetPosition = targetColumn?.todos.length || 0;
    } else {
      const overId = Number(String(over.id).replace("todo-", ""));
      const overColumn = findColumnByTodoId(overId);
      if (!overColumn) return;
      targetColumnId = overColumn.id;
      const overTodo = overColumn.todos.find((t) => t.id === overId);
      targetPosition = overTodo?.position || 0;
    }

    try {
      await api.moveTodo(activeId, targetColumnId, targetPosition);
      onRefresh();
    } catch (err) {
      console.error("Move failed:", err);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 px-4">
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            onAddTodo={onAddTodo}
            onEditTodo={onEditTodo}
            onDeleteTodo={onDeleteTodo}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTodo ? (
          <div className="rotate-2 opacity-90">
            <TodoCard todo={activeTodo} onEdit={() => {}} onDelete={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
