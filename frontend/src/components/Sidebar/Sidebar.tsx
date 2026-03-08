"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  FolderKanban,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/types";

const PROJECT_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
];

interface SidebarProps {
  projects: Project[];
  selectedProjectId: number | null;
  collapsed: boolean;
  onSelectProject: (projectId: number | null) => void;
  onToggleCollapse: () => void;
  onCreateProject: (data: { name: string; color: string }) => void;
  onUpdateProject: (id: number, data: { name: string; color: string }) => void;
  onDeleteProject: (id: number) => void;
}

export function Sidebar({
  projects,
  selectedProjectId,
  collapsed,
  onSelectProject,
  onToggleCollapse,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}: SidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    onCreateProject({ name: newName.trim(), color: newColor });
    setNewName("");
    setNewColor(PROJECT_COLORS[0]);
    setIsAdding(false);
  };

  const handleEdit = (id: number) => {
    if (!editName.trim()) return;
    onUpdateProject(id, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditColor(project.color);
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center w-12 min-h-screen border-r bg-card py-3 gap-2">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title="사이드바 펼치기"
        >
          <PanelLeft className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="w-6 border-t border-border my-1" />

        <button
          onClick={() => onSelectProject(null)}
          className={`p-1.5 rounded-md transition-colors ${
            selectedProjectId === null ? "bg-accent" : "hover:bg-accent"
          }`}
          title="전체"
        >
          <Layers className="h-4 w-4 text-muted-foreground" />
        </button>

        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`p-1.5 rounded-md transition-colors ${
              selectedProjectId === project.id ? "bg-accent" : "hover:bg-accent"
            }`}
            title={project.name}
          >
            <div
              className="h-4 w-4 rounded-sm"
              style={{ backgroundColor: project.color }}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-60 min-h-screen border-r bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">프로젝트</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md hover:bg-accent transition-colors"
          title="사이드바 접기"
        >
          <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* All projects */}
        <button
          onClick={() => onSelectProject(null)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
            selectedProjectId === null
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:bg-accent/50"
          }`}
        >
          <Layers className="h-4 w-4 shrink-0" />
          <span className="truncate">전체</span>
        </button>

        {/* Project items */}
        {projects.map((project) => (
          <div key={project.id} className="group relative">
            {editingId === project.id ? (
              <div className="px-3 py-1.5 space-y-1.5">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit(project.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <div className="flex gap-1 flex-wrap">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={`h-4 w-4 rounded-sm border ${
                        editColor === c ? "border-foreground ring-1 ring-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => handleEdit(project.id)}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setEditingId(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onSelectProject(project.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  selectedProjectId === project.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                <div
                  className="h-3.5 w-3.5 rounded-sm shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.name}</span>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    onClick={(e) => e.stopPropagation()}
                    className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-opacity"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={() => startEdit(project)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" /> 수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteProject(project.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> 삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </button>
            )}
          </div>
        ))}

        {/* Add project */}
        {isAdding ? (
          <div className="px-3 py-2 space-y-1.5">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="프로젝트 이름"
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setIsAdding(false);
              }}
            />
            <div className="flex gap-1 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`h-4 w-4 rounded-sm border ${
                    newColor === c ? "border-foreground ring-1 ring-foreground" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-6 px-2" onClick={handleAdd}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setIsAdding(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>프로젝트 추가</span>
          </button>
        )}
      </div>
    </div>
  );
}
