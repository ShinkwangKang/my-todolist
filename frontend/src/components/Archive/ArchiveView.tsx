"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Archive, RotateCcw, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
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

interface ArchiveViewProps {
  projectId?: number;
  onRefresh: () => void;
}

export function ArchiveView({ projectId, onRefresh }: ArchiveViewProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchArchived = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getArchivedTodos(projectId);
      setTodos(data);
    } catch (err) {
      console.error("Failed to fetch archived todos:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const handleUnarchive = async (id: number) => {
    try {
      await api.unarchiveTodo(id);
      fetchArchived();
      onRefresh();
    } catch (err) {
      console.error("Failed to unarchive:", err);
    }
  };

  const filteredTodos = search
    ? todos.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase())
      )
    : todos;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-6 py-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">아카이브</h2>
          <span className="text-sm text-muted-foreground">({todos.length})</span>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="아카이브 검색..."
            className="pl-9 h-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {search ? "검색 결과가 없습니다." : "아카이브된 항목이 없습니다."}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow"
            >
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
                  <Badge variant="outline" className={`text-xs ${priorityConfig[todo.priority].color}`}>
                    {priorityConfig[todo.priority].label}
                  </Badge>
                </div>

                <h3 className="text-sm font-medium text-foreground truncate">{todo.title}</h3>

                {todo.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{todo.description}</p>
                )}

                <div className="flex items-center gap-2 mt-1">
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
                  {todo.archived_at && (
                    <span className="text-xs text-muted-foreground">
                      아카이브:{" "}
                      {new Date(todo.archived_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleUnarchive(todo.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="복원"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                복원
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
