"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoreHorizontal, Pencil, Trash2, Clock, AlertTriangle } from "lucide-react";
import type { Todo } from "@/types";

const priorityConfig = {
  high: { label: "높음", color: "bg-red-100 text-red-700 border-red-200" },
  medium: { label: "보통", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  low: { label: "낮음", color: "bg-green-100 text-green-700 border-green-200" },
};

const categoryConfig = {
  work: { label: "업무", color: "bg-blue-100 text-blue-700" },
  personal: { label: "개인", color: "bg-purple-100 text-purple-700" },
};

interface TodoCardProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
}

export function TodoCard({ todo, onEdit, onDelete }: TodoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `todo-${todo.id}`, data: { type: "todo", todo } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    todo.due_date && !todo.is_completed && new Date(todo.due_date) < new Date();
  const isDueSoon =
    todo.due_date &&
    !todo.is_completed &&
    !isOverdue &&
    new Date(todo.due_date).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? "opacity-50 shadow-lg" : ""
      } ${isOverdue ? "border-red-300" : isDueSoon ? "border-yellow-300" : "border-gray-200"}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-1.5 py-0.5 rounded ${categoryConfig[todo.category].color}`}>
              {categoryConfig[todo.category].label}
            </span>
            {todo.task_type && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: todo.task_type.color + "20", color: todo.task_type.color }}
              >
                {todo.task_type.name}
              </span>
            )}
          </div>

          <h3 className={`text-sm font-medium ${todo.is_completed ? "line-through text-gray-400" : "text-gray-900"}`}>
            {todo.title}
          </h3>

          {todo.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{todo.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge variant="outline" className={`text-xs ${priorityConfig[todo.priority].color}`}>
              {priorityConfig[todo.priority].label}
            </Badge>

            {todo.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>

          {todo.due_date && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              isOverdue ? "text-red-600" : isDueSoon ? "text-yellow-600" : "text-gray-500"
            }`}>
              {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              <span>
                {new Date(todo.due_date).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(todo)}>
              <Pencil className="h-4 w-4 mr-2" /> 수정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(todo.id)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" /> 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
