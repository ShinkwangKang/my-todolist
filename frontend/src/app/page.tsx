"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/Board/KanbanBoard";
import { WeeklyBoard } from "@/components/Weekly/WeeklyBoard";
import { WeeklyReport } from "@/components/Report/WeeklyReport";
import { TodoFormDialog } from "@/components/Card/TodoFormDialog";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { FilterPanel } from "@/components/Filter/FilterPanel";
import { ArchiveView } from "@/components/Archive/ArchiveView";
import { LayoutGrid, CalendarDays, FileText, Archive, Plus, Loader2, Sun, Moon, Monitor } from "lucide-react";
import { api } from "@/lib/api";
import { getStoredTheme, setStoredTheme, initTheme } from "@/lib/theme";
import { filterTodos, emptyFilters, type Filters } from "@/lib/filter";
import type { Column, Todo, Tag, TaskType, Project, Category, Priority } from "@/types";

function getSavedSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("sidebar-collapsed") === "true";
}

export default function Home() {
  const [view, setView] = useState<"kanban" | "weekly" | "report" | "archive">("kanban");
  const [columns, setColumns] = useState<Column[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(true);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<number | undefined>();
  const [defaultStartDate, setDefaultStartDate] = useState<string | undefined>();

  // Load sidebar collapsed state and theme from localStorage
  useEffect(() => {
    setSidebarCollapsed(getSavedSidebarCollapsed());
    setTheme(getStoredTheme());
    initTheme();
  }, []);

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    setStoredTheme(next);
  };

  const fetchData = useCallback(async () => {
    try {
      const [cols, tgs, tts, prjs] = await Promise.all([
        api.getColumns(selectedProjectId ?? undefined),
        api.getTags(),
        api.getTaskTypes(),
        api.getProjects(),
      ]);
      setColumns(cols);
      setTags(tgs);
      setTaskTypes(tts);
      setProjects(prjs);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const handleSelectProject = (projectId: number | null) => {
    setSelectedProjectId(projectId);
  };

  const handleCreateProject = async (data: { name: string; color: string }) => {
    try {
      await api.createProject(data);
      const prjs = await api.getProjects();
      setProjects(prjs);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const handleUpdateProject = async (id: number, data: { name: string; color: string }) => {
    try {
      await api.updateProject(id, data);
      const prjs = await api.getProjects();
      setProjects(prjs);
    } catch (err) {
      console.error("Failed to update project:", err);
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await api.deleteProject(id);
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
      const prjs = await api.getProjects();
      setProjects(prjs);
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleAddTodo = (columnId: number) => {
    setEditingTodo(null);
    setDefaultColumnId(columnId);
    setDefaultStartDate(undefined);
    setFormOpen(true);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setDefaultColumnId(undefined);
    setDefaultStartDate(undefined);
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
    start_date?: string;
    due_date?: string;
    completed_at?: string;
    column_id: number;
    tag_ids: number[];
  }) => {
    try {
      const todoData = {
        ...data,
        project_id: selectedProjectId ?? undefined,
      };
      if (editingTodo) {
        await api.updateTodo(editingTodo.id, todoData);
      } else {
        await api.createTodo(todoData);
      }
      fetchData();
    } catch (err) {
      console.error("Failed to save todo:", err);
    }
  };

  const handleArchiveTodo = async (id: number) => {
    try {
      await api.archiveTodo(id);
      fetchData();
    } catch (err) {
      console.error("Failed to archive todo:", err);
    }
  };

  const handleBulkArchive = async (columnId: number) => {
    try {
      await api.bulkArchive(columnId);
      fetchData();
    } catch (err) {
      console.error("Failed to bulk archive:", err);
    }
  };

  // Apply filters to columns for kanban view
  const filteredColumns = columns.map((col) => ({
    ...col,
    todos: filterTodos(col.todos, filters),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        collapsed={sidebarCollapsed}
        onSelectProject={handleSelectProject}
        onToggleCollapse={handleToggleSidebar}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="relative bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">
                {selectedProjectId
                  ? projects.find((p) => p.id === selectedProjectId)?.name ?? "My TodoList"
                  : "My TodoList"}
              </h1>
              {view === "kanban" && (
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  tags={tags}
                  taskTypes={taskTypes}
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "weekly" | "report" | "archive")}>
                <TabsList>
                  <TabsTrigger value="kanban" className="flex items-center gap-1.5">
                    <LayoutGrid className="h-4 w-4" />
                    칸반 보드
                  </TabsTrigger>
                  <TabsTrigger value="weekly" className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    주간 보드
                  </TabsTrigger>
                  <TabsTrigger value="report" className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    주간 리포트
                  </TabsTrigger>
                  <TabsTrigger value="archive" className="flex items-center gap-1.5">
                    <Archive className="h-4 w-4" />
                    아카이브
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <button
                onClick={cycleTheme}
                className="p-2 rounded-md hover:bg-accent transition-colors"
                title={theme === "light" ? "라이트 모드" : theme === "dark" ? "다크 모드" : "시스템"}
              >
                {theme === "light" ? (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                ) : theme === "dark" ? (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              <Button
                size="sm"
                onClick={() => {
                  setEditingTodo(null);
                  setDefaultColumnId(columns[0]?.id);
                  setDefaultStartDate(undefined);
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
        <main className="flex-1 pt-4">
          {view === "kanban" ? (
            <KanbanBoard
              columns={filteredColumns}
              onRefresh={fetchData}
              onAddTodo={handleAddTodo}
              onEditTodo={handleEditTodo}
              onDeleteTodo={handleDeleteTodo}
              onArchiveTodo={handleArchiveTodo}
              onBulkArchive={handleBulkArchive}
            />
          ) : view === "weekly" ? (
            <WeeklyBoard
              onEditTodo={handleEditTodo}
              onAddTodo={(defaultStartDate?: string) => {
                setEditingTodo(null);
                setDefaultColumnId(columns[0]?.id);
                setDefaultStartDate(defaultStartDate);
                setFormOpen(true);
              }}
              onRefresh={fetchData}
              columns={columns}
              projectId={selectedProjectId ?? undefined}
            />
          ) : view === "report" ? (
            <WeeklyReport projectId={selectedProjectId ?? undefined} />
          ) : (
            <ArchiveView projectId={selectedProjectId ?? undefined} onRefresh={fetchData} />
          )}
        </main>
      </div>

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
        defaultStartDate={defaultStartDate}
      />
    </div>
  );
}
