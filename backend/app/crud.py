from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from typing import Optional

from . import models, schemas


# ===== Column =====

def get_columns(db: Session):
    return db.query(models.BoardColumn).order_by(models.BoardColumn.position).all()


def get_columns_with_todos(db: Session):
    return (
        db.query(models.BoardColumn)
        .options(
            joinedload(models.BoardColumn.todos).joinedload(models.Todo.tags),
            joinedload(models.BoardColumn.todos).joinedload(models.Todo.task_type),
        )
        .order_by(models.BoardColumn.position)
        .all()
    )


def create_column(db: Session, column: schemas.ColumnCreate):
    max_pos = db.query(func.max(models.BoardColumn.position)).scalar() or -1
    db_column = models.BoardColumn(title=column.title, position=max_pos + 1)
    db.add(db_column)
    db.commit()
    db.refresh(db_column)
    return db_column


def update_column(db: Session, column_id: int, column: schemas.ColumnUpdate):
    db_column = db.query(models.BoardColumn).filter(models.BoardColumn.id == column_id).first()
    if not db_column:
        return None
    db_column.title = column.title
    db.commit()
    db.refresh(db_column)
    return db_column


def delete_column(db: Session, column_id: int):
    db_column = db.query(models.BoardColumn).filter(models.BoardColumn.id == column_id).first()
    if not db_column:
        return False
    db.delete(db_column)
    db.commit()
    return True


def reorder_columns(db: Session, column_ids: list[int]):
    for i, col_id in enumerate(column_ids):
        db.query(models.BoardColumn).filter(models.BoardColumn.id == col_id).update({"position": i})
    db.commit()


# ===== TaskType =====

def get_task_types(db: Session):
    return db.query(models.TaskType).order_by(models.TaskType.position).all()


def create_task_type(db: Session, task_type: schemas.TaskTypeCreate):
    max_pos = db.query(func.max(models.TaskType.position)).scalar() or -1
    db_task_type = models.TaskType(
        name=task_type.name, color=task_type.color, icon=task_type.icon, position=max_pos + 1
    )
    db.add(db_task_type)
    db.commit()
    db.refresh(db_task_type)
    return db_task_type


def update_task_type(db: Session, task_type_id: int, task_type: schemas.TaskTypeUpdate):
    db_tt = db.query(models.TaskType).filter(models.TaskType.id == task_type_id).first()
    if not db_tt:
        return None
    db_tt.name = task_type.name
    db_tt.color = task_type.color
    db_tt.icon = task_type.icon
    db.commit()
    db.refresh(db_tt)
    return db_tt


def delete_task_type(db: Session, task_type_id: int):
    db_tt = db.query(models.TaskType).filter(models.TaskType.id == task_type_id).first()
    if not db_tt:
        return False
    db.delete(db_tt)
    db.commit()
    return True


# ===== Tag =====

def get_tags(db: Session):
    return db.query(models.Tag).all()


def create_tag(db: Session, tag: schemas.TagCreate):
    db_tag = models.Tag(name=tag.name, color=tag.color)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


def update_tag(db: Session, tag_id: int, tag: schemas.TagUpdate):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not db_tag:
        return None
    db_tag.name = tag.name
    db_tag.color = tag.color
    db.commit()
    db.refresh(db_tag)
    return db_tag


def delete_tag(db: Session, tag_id: int):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not db_tag:
        return False
    db.delete(db_tag)
    db.commit()
    return True


# ===== Todo =====

def get_todos(
    db: Session,
    column_id: Optional[int] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    task_type_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    is_completed: Optional[bool] = None,
):
    query = (
        db.query(models.Todo)
        .options(joinedload(models.Todo.tags), joinedload(models.Todo.task_type))
    )
    if column_id is not None:
        query = query.filter(models.Todo.column_id == column_id)
    if priority is not None:
        query = query.filter(models.Todo.priority == priority)
    if category is not None:
        query = query.filter(models.Todo.category == category)
    if task_type_id is not None:
        query = query.filter(models.Todo.task_type_id == task_type_id)
    if tag_id is not None:
        query = query.filter(models.Todo.tags.any(models.Tag.id == tag_id))
    if is_completed is not None:
        query = query.filter(models.Todo.is_completed == is_completed)
    return query.order_by(models.Todo.position).all()


def create_todo(db: Session, todo: schemas.TodoCreate):
    max_pos = (
        db.query(func.max(models.Todo.position))
        .filter(models.Todo.column_id == todo.column_id)
        .scalar()
        or -1
    )
    db_todo = models.Todo(
        title=todo.title,
        description=todo.description,
        category=todo.category,
        task_type_id=todo.task_type_id,
        priority=todo.priority,
        due_date=todo.due_date,
        column_id=todo.column_id,
        position=max_pos + 1,
    )
    if todo.tag_ids:
        tags = db.query(models.Tag).filter(models.Tag.id.in_(todo.tag_ids)).all()
        db_todo.tags = tags
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


def update_todo(db: Session, todo_id: int, todo: schemas.TodoUpdate):
    db_todo = (
        db.query(models.Todo)
        .options(joinedload(models.Todo.tags), joinedload(models.Todo.task_type))
        .filter(models.Todo.id == todo_id)
        .first()
    )
    if not db_todo:
        return None

    update_data = todo.model_dump(exclude_unset=True)
    tag_ids = update_data.pop("tag_ids", None)

    for key, value in update_data.items():
        if key == "is_completed" and value is True and not db_todo.is_completed:
            db_todo.completed_at = datetime.now(timezone.utc)
        elif key == "is_completed" and value is False:
            db_todo.completed_at = None
        setattr(db_todo, key, value)

    if tag_ids is not None:
        tags = db.query(models.Tag).filter(models.Tag.id.in_(tag_ids)).all()
        db_todo.tags = tags

    db.commit()
    db.refresh(db_todo)
    return db_todo


def delete_todo(db: Session, todo_id: int):
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if not db_todo:
        return False
    db.delete(db_todo)
    db.commit()
    return True


def move_todo(db: Session, todo_id: int, move: schemas.TodoMove):
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if not db_todo:
        return None

    old_column_id = db_todo.column_id
    old_position = db_todo.position

    # Remove from old position
    db.query(models.Todo).filter(
        models.Todo.column_id == old_column_id,
        models.Todo.position > old_position,
    ).update({"position": models.Todo.position - 1})

    # Insert at new position
    db.query(models.Todo).filter(
        models.Todo.column_id == move.column_id,
        models.Todo.position >= move.position,
    ).update({"position": models.Todo.position + 1})

    db_todo.column_id = move.column_id
    db_todo.position = move.position

    # Track completion when moved to Done column
    done_column = db.query(models.BoardColumn).filter(models.BoardColumn.title == "Done").first()
    if done_column and move.column_id == done_column.id and not db_todo.is_completed:
        db_todo.is_completed = True
        db_todo.completed_at = datetime.now(timezone.utc)
    elif done_column and move.column_id != done_column.id and old_column_id == done_column.id:
        db_todo.is_completed = False
        db_todo.completed_at = None

    db.commit()
    db.refresh(db_todo)
    return db_todo


# ===== Weekly =====

def get_weekly_todos(db: Session, date: datetime):
    # Calculate week boundaries (Monday to Sunday)
    weekday = date.weekday()
    week_start = date.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=weekday)
    week_end = week_start + timedelta(days=7) - timedelta(seconds=1)

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1) - timedelta(seconds=1)

    base_query = db.query(models.Todo).options(
        joinedload(models.Todo.tags), joinedload(models.Todo.task_type)
    )

    # Today's todos: due today or in progress
    in_progress_col = db.query(models.BoardColumn).filter(models.BoardColumn.title == "In Progress").first()
    today = base_query.filter(
        ((models.Todo.due_date >= today_start) & (models.Todo.due_date <= today_end))
        | (models.Todo.column_id == in_progress_col.id if in_progress_col else False)
    ).order_by(models.Todo.priority, models.Todo.position).all()

    # Added this week
    added_this_week = base_query.filter(
        models.Todo.created_at >= week_start,
        models.Todo.created_at <= week_end,
    ).order_by(models.Todo.created_at.desc()).all()

    # In progress
    in_progress = []
    if in_progress_col:
        in_progress = base_query.filter(
            models.Todo.column_id == in_progress_col.id
        ).order_by(models.Todo.position).all()

    # Completed this week
    completed_this_week = base_query.filter(
        models.Todo.completed_at >= week_start,
        models.Todo.completed_at <= week_end,
    ).order_by(models.Todo.completed_at.desc()).all()

    # Overdue
    overdue = base_query.filter(
        models.Todo.due_date < today_start,
        models.Todo.is_completed == False,
    ).order_by(models.Todo.due_date).all()

    return {
        "today": today,
        "added_this_week": added_this_week,
        "in_progress": in_progress,
        "completed_this_week": completed_this_week,
        "overdue": overdue,
        "week_start": week_start,
        "week_end": week_end,
    }
