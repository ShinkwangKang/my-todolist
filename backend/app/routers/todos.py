from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/todos", tags=["todos"])


@router.get("", response_model=list[schemas.TodoResponse])
def list_todos(
    column_id: Optional[int] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    task_type_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    is_completed: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    return crud.get_todos(
        db,
        column_id=column_id,
        priority=priority,
        category=category,
        task_type_id=task_type_id,
        tag_id=tag_id,
        is_completed=is_completed,
    )


@router.get("/weekly", response_model=schemas.WeeklyResponse)
def get_weekly(
    date: date = Query(default=None, description="Date within the week (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    if date is None:
        date = datetime.utcnow()
    else:
        date = datetime.combine(date, datetime.min.time())
    return crud.get_weekly_todos(db, date)


@router.post("", response_model=schemas.TodoResponse, status_code=201)
def create_todo(todo: schemas.TodoCreate, db: Session = Depends(get_db)):
    return crud.create_todo(db, todo)


@router.put("/{todo_id}", response_model=schemas.TodoResponse)
def update_todo(todo_id: int, todo: schemas.TodoUpdate, db: Session = Depends(get_db)):
    result = crud.update_todo(db, todo_id, todo)
    if not result:
        raise HTTPException(status_code=404, detail="Todo not found")
    return result


@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    if not crud.delete_todo(db, todo_id):
        raise HTTPException(status_code=404, detail="Todo not found")


@router.put("/{todo_id}/move", response_model=schemas.TodoResponse)
def move_todo(todo_id: int, move: schemas.TodoMove, db: Session = Depends(get_db)):
    result = crud.move_todo(db, todo_id, move)
    if not result:
        raise HTTPException(status_code=404, detail="Todo not found")
    return result


# --- DailyProgress ---

class DailyProgressUpsertBody(BaseModel):
    content: str


@router.get("/{todo_id}/daily-progress", response_model=list[schemas.DailyProgressResponse])
def get_daily_progress(todo_id: int, db: Session = Depends(get_db)):
    return crud.get_daily_progress(db, todo_id)


@router.put("/{todo_id}/daily-progress/{date_str}", response_model=schemas.DailyProgressResponse)
def upsert_daily_progress(
    todo_id: int,
    date_str: str,
    body: DailyProgressUpsertBody,
    db: Session = Depends(get_db),
):
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=422, detail="date must be YYYY-MM-DD")
    return crud.upsert_daily_progress(db, todo_id, dt, body.content)


@router.delete("/{todo_id}/daily-progress/{date_str}", status_code=204)
def delete_daily_progress(todo_id: int, date_str: str, db: Session = Depends(get_db)):
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=422, detail="date must be YYYY-MM-DD")
    if not crud.delete_daily_progress(db, todo_id, dt):
        raise HTTPException(status_code=404, detail="DailyProgress not found")
