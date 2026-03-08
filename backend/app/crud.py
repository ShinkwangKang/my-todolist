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
        start_date=todo.start_date,
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
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

    now = datetime.now(timezone.utc)
    # Use naive datetime for today to match week_start/week_end (also naive)
    today_naive = now.replace(tzinfo=None)
    today_start = today_naive.replace(hour=0, minute=0, second=0, microsecond=0)

    # Day boundaries for Mon(0)..Fri(4), Sat(5)+Sun(6) -> weekend
    # week_start is Monday
    day_starts = [week_start + timedelta(days=i) for i in range(7)]  # Mon..Sun
    day_ends = [day_starts[i] + timedelta(days=1) - timedelta(seconds=1) for i in range(7)]

    base_query = db.query(models.Todo).options(
        joinedload(models.Todo.tags),
        joinedload(models.Todo.task_type),
        joinedload(models.Todo.daily_progress),
    )

    # Fetch all todos that have a start_date within this week
    week_todos = base_query.filter(
        models.Todo.start_date >= week_start,
        models.Todo.start_date <= week_end,
    ).order_by(models.Todo.position).all()

    # day_key_map: index 0=mon,1=tue,2=wed,3=thu,4=fri,5=weekend(sat),6=weekend(sun)
    day_keys = ["mon", "tue", "wed", "thu", "fri", "weekend", "weekend"]

    result: dict[str, list] = {
        "mon": [], "tue": [], "wed": [], "thu": [], "fri": [], "weekend": []
    }

    for todo in week_todos:
        start = todo.start_date
        # Determine which weekday this todo originally belongs to
        for i in range(7):
            if day_starts[i] <= start <= day_ends[i]:
                original_day_idx = i
                break
        else:
            continue

        is_done = todo.is_completed or (todo.column_id and db.query(models.BoardColumn).filter(
            models.BoardColumn.id == todo.column_id,
            models.BoardColumn.title.in_(["Done", "Cancel"])
        ).first() is not None)

        if is_done:
            # Completed/cancelled: show from start_date to min(due_date, completed_at)
            completed_at = todo.completed_at or todo.updated_at or start
            end_date = completed_at
            if todo.due_date:
                due_naive = todo.due_date.replace(hour=23, minute=59, second=59, microsecond=0)
                end_date = min(end_date, due_naive)
            end_day_idx = None
            for i in range(7):
                if day_starts[i] <= end_date <= day_ends[i]:
                    end_day_idx = i
                    break
            if end_day_idx is None:
                end_day_idx = 6 if end_date > week_end else original_day_idx
            for i in range(original_day_idx, end_day_idx + 1):
                key = day_keys[i]
                if todo not in result[key]:
                    result[key].append(todo)
        else:
            # Carryover: show from start_date up to min(today, due_date)
            end_limit = today_start
            if todo.due_date:
                due_start = todo.due_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_limit = min(end_limit, due_start)
            for i in range(original_day_idx, 7):
                col_start = day_starts[i]
                if col_start > end_limit:
                    break
                key = day_keys[i]
                if todo not in result[key]:
                    result[key].append(todo)

    return {
        "mon": result["mon"],
        "tue": result["tue"],
        "wed": result["wed"],
        "thu": result["thu"],
        "fri": result["fri"],
        "weekend": result["weekend"],
        "week_start": week_start,
        "week_end": week_end,
    }


# ===== DailyProgress =====

def get_daily_progress(db: Session, todo_id: int):
    return (
        db.query(models.DailyProgress)
        .filter(models.DailyProgress.todo_id == todo_id)
        .order_by(models.DailyProgress.date)
        .all()
    )


def upsert_daily_progress(db: Session, todo_id: int, date: datetime, content: str):
    # Normalize date to day boundary (strip time)
    date_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    existing = (
        db.query(models.DailyProgress)
        .filter(
            models.DailyProgress.todo_id == todo_id,
            models.DailyProgress.date == date_day,
        )
        .first()
    )
    if existing:
        existing.content = content
        db.commit()
        db.refresh(existing)
        return existing
    else:
        dp = models.DailyProgress(todo_id=todo_id, date=date_day, content=content)
        db.add(dp)
        db.commit()
        db.refresh(dp)
        return dp


def delete_daily_progress(db: Session, todo_id: int, date: datetime):
    date_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    dp = (
        db.query(models.DailyProgress)
        .filter(
            models.DailyProgress.todo_id == todo_id,
            models.DailyProgress.date == date_day,
        )
        .first()
    )
    if not dp:
        return False
    db.delete(dp)
    db.commit()
    return True
