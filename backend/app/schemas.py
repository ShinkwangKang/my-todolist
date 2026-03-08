from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .models import Priority, Category


# --- Column ---
class ColumnBase(BaseModel):
    title: str

class ColumnCreate(ColumnBase):
    pass

class ColumnUpdate(ColumnBase):
    pass

class ColumnResponse(ColumnBase):
    id: int
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class ColumnReorder(BaseModel):
    column_ids: list[int]


# --- TaskType ---
class TaskTypeBase(BaseModel):
    name: str
    color: str = "#6B7280"
    icon: Optional[str] = None

class TaskTypeCreate(TaskTypeBase):
    pass

class TaskTypeUpdate(TaskTypeBase):
    pass

class TaskTypeResponse(TaskTypeBase):
    id: int
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Tag ---
class TagBase(BaseModel):
    name: str
    color: str = "#3B82F6"

class TagCreate(TagBase):
    pass

class TagUpdate(TagBase):
    pass

class TagResponse(TagBase):
    id: int

    model_config = {"from_attributes": True}


# --- Todo ---
class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Category = Category.WORK
    task_type_id: Optional[int] = None
    priority: Priority = Priority.MEDIUM
    due_date: Optional[datetime] = None

class TodoCreate(TodoBase):
    column_id: int
    tag_ids: list[int] = []

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[Category] = None
    task_type_id: Optional[int] = None
    priority: Optional[Priority] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    tag_ids: Optional[list[int]] = None

class TodoMove(BaseModel):
    column_id: int
    position: int

class TodoResponse(TodoBase):
    id: int
    is_completed: bool
    completed_at: Optional[datetime]
    column_id: int
    position: int
    tags: list[TagResponse] = []
    task_type: Optional[TaskTypeResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Column with Todos ---
class ColumnWithTodos(ColumnResponse):
    todos: list[TodoResponse] = []


# --- Weekly ---
class WeeklyResponse(BaseModel):
    today: list[TodoResponse]
    added_this_week: list[TodoResponse]
    in_progress: list[TodoResponse]
    completed_this_week: list[TodoResponse]
    overdue: list[TodoResponse]
    week_start: datetime
    week_end: datetime
