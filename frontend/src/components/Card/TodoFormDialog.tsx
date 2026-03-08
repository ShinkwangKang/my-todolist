"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Todo, Tag, TaskType, Column, Priority, Category } from "@/types";

interface TodoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    category: Category;
    task_type_id?: number;
    priority: Priority;
    due_date?: string;
    column_id: number;
    tag_ids: number[];
  }) => void;
  todo?: Todo | null;
  columns: Column[];
  tags: Tag[];
  taskTypes: TaskType[];
  defaultColumnId?: number;
}

export function TodoFormDialog({
  open,
  onOpenChange,
  onSubmit,
  todo,
  columns,
  tags,
  taskTypes,
  defaultColumnId,
}: TodoFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("work");
  const [taskTypeId, setTaskTypeId] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [columnId, setColumnId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || "");
      setCategory(todo.category);
      setTaskTypeId(todo.task_type_id?.toString() || "");
      setPriority(todo.priority);
      setDueDate(todo.due_date ? todo.due_date.slice(0, 16) : "");
      setColumnId(todo.column_id.toString());
      setSelectedTagIds(todo.tags.map((t) => t.id));
    } else {
      setTitle("");
      setDescription("");
      setCategory("work");
      setTaskTypeId("");
      setPriority("medium");
      setDueDate("");
      setColumnId(defaultColumnId?.toString() || columns[0]?.id.toString() || "");
      setSelectedTagIds([]);
    }
  }, [todo, open, defaultColumnId, columns]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      task_type_id: taskTypeId ? Number(taskTypeId) : undefined,
      priority,
      due_date: dueDate || undefined,
      column_id: Number(columnId),
      tag_ids: selectedTagIds,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{todo ? "할 일 수정" : "새 할 일"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할 일을 입력하세요"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세 설명 (선택)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>카테고리</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">업무</SelectItem>
                  <SelectItem value="personal">개인</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>업무 유형</Label>
              <Select value={taskTypeId} onValueChange={(v) => setTaskTypeId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  {taskTypes.map((tt) => (
                    <SelectItem key={tt.id} value={tt.id.toString()}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tt.color }}
                        />
                        {tt.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>우선순위</Label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>컬럼</Label>
              <Select value={columnId} onValueChange={(v) => setColumnId(v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id.toString()}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="due_date">마감일</Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <Label>태그</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  style={
                    selectedTagIds.includes(tag.id)
                      ? { backgroundColor: tag.color, borderColor: tag.color }
                      : { borderColor: tag.color, color: tag.color }
                  }
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
              {tags.length === 0 && (
                <span className="text-xs text-gray-400">태그가 없습니다</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">{todo ? "수정" : "생성"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
