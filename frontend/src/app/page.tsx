"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/Board/KanbanBoard";
import { WeeklyBoard } from "@/components/Weekly/WeeklyBoard";
import { TodoFormDialog } from "@/components/Card/TodoFormDialog";
import { LayoutGrid, CalendarDays, Plus, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Column, Todo, Tag, TaskType, Category, Priority } from "@/types";

export default function Home() {
  const [view, setView] = useState<"kanban" | "weekly">("kanban");
  const [columns, setColumns] = useState<Column[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<number | undefined>();

  const fetchData = useCallback(async () => {
    try {
      const [cols, tgs, tts] = await Promise.all([
        api.getColumns(),
        api.getTags(),
        api.getTaskTypes(),
      ]);
      setColumns(cols);
      setTags(tgs);
      setTaskTypes(tts);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTodo = (columnId: number) => {
    setEditingTodo(null);
    setDefaultColumnId(columnId);
    setFormOpen(true);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setDefaultColumnId(undefined);
    setFormOpen(true);
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await api.deleteTodo(id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  };

  const handleSubmitTodo = async (data: {
    title: string;
    description?: string;
    category: Category;
    task_type_id?: number;
    priority: Priority;
    due_date?: string;
    column_id: number;
    tag_ids: number[];
  }) => {
    try {
      if (editingTodo) {
        await api.updateTodo(editingTodo.id, data);
      } else {
        await api.createTodo(data);
      }
      fetchData();
    } catch (err) {
      console.error("Failed to save todo:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <h1 className="text-xl font-bold text-gray-800">My TodoList</h1>

          <div className="flex items-center gap-4">
            <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "weekly")}>
              <TabsList>
                <TabsTrigger value="kanban" className="flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4" />
                  칸반 보드
                </TabsTrigger>
                <TabsTrigger value="weekly" className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  주간 보드
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              size="sm"
              onClick={() => {
                setEditingTodo(null);
                setDefaultColumnId(columns[0]?.id);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              새 할 일
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-4">
        {view === "kanban" ? (
          <KanbanBoard
            columns={columns}
            onRefresh={fetchData}
            onAddTodo={handleAddTodo}
            onEditTodo={handleEditTodo}
            onDeleteTodo={handleDeleteTodo}
          />
        ) : (
          <WeeklyBoard onEditTodo={handleEditTodo} />
        )}
      </main>

      {/* Todo Form Dialog */}
      <TodoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmitTodo}
        todo={editingTodo}
        columns={columns}
        tags={tags}
        taskTypes={taskTypes}
        defaultColumnId={defaultColumnId}
      />
    </div>
  );
}
