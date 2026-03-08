"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import type { Tag, TaskType, Priority, Category } from "@/types";
import type { Filters } from "@/lib/filter";
import { emptyFilters, countActiveFilters } from "@/lib/filter";

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "high", label: "높음", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "medium", label: "보통", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "low", label: "낮음", color: "bg-green-100 text-green-700 border-green-200" },
];

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: "work", label: "업무", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "personal", label: "개인", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  tags: Tag[];
  taskTypes: TaskType[];
}

export function FilterPanel({ filters, onFiltersChange, tags, taskTypes }: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const activeCount = countActiveFilters(filters);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const togglePriority = (p: Priority) => {
    const next = filters.priorities.includes(p)
      ? filters.priorities.filter((v) => v !== p)
      : [...filters.priorities, p];
    onFiltersChange({ ...filters, priorities: next });
  };

  const toggleCategory = (c: Category) => {
    const next = filters.categories.includes(c)
      ? filters.categories.filter((v) => v !== c)
      : [...filters.categories, c];
    onFiltersChange({ ...filters, categories: next });
  };

  const toggleTaskType = (id: number) => {
    const next = filters.taskTypeIds.includes(id)
      ? filters.taskTypeIds.filter((v) => v !== id)
      : [...filters.taskTypeIds, id];
    onFiltersChange({ ...filters, taskTypeIds: next });
  };

  const toggleTag = (id: number) => {
    const next = filters.tagIds.includes(id)
      ? filters.tagIds.filter((v) => v !== id)
      : [...filters.tagIds, id];
    onFiltersChange({ ...filters, tagIds: next });
  };

  const resetFilters = () => {
    setSearchInput("");
    onFiltersChange(emptyFilters);
  };

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
          activeCount > 0
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        필터
        {activeCount > 0 && (
          <span className="bg-primary-foreground text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
            {activeCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-20 bg-card border-b border-border shadow-md">
          <div className="px-6 py-3 space-y-3">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="제목 또는 설명 검색..."
                className="pl-9 h-8 text-sm"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Filter groups */}
            <div className="flex flex-wrap gap-4">
              {/* Priority */}
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">우선순위</span>
                <div className="flex gap-1">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => togglePriority(p.value)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        filters.priorities.includes(p.value)
                          ? p.color + " font-medium"
                          : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">카테고리</span>
                <div className="flex gap-1">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => toggleCategory(c.value)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        filters.categories.includes(c.value)
                          ? c.color + " font-medium"
                          : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Types */}
              {taskTypes.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">업무 유형</span>
                  <div className="flex gap-1 flex-wrap">
                    {taskTypes.map((tt) => (
                      <button
                        key={tt.id}
                        onClick={() => toggleTaskType(tt.id)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          filters.taskTypeIds.includes(tt.id)
                            ? "font-medium"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                        style={
                          filters.taskTypeIds.includes(tt.id)
                            ? { backgroundColor: tt.color + "20", color: tt.color, borderColor: tt.color }
                            : undefined
                        }
                      >
                        {tt.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">태그</span>
                  <div className="flex gap-1 flex-wrap">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          filters.tagIds.includes(tag.id)
                            ? "font-medium"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                        style={
                          filters.tagIds.includes(tag.id)
                            ? { borderColor: tag.color, color: tag.color }
                            : undefined
                        }
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reset */}
            {activeCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                필터 초기화
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
