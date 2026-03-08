from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/columns", tags=["columns"])


@router.get("", response_model=list[schemas.ColumnWithTodos])
def list_columns(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_columns_with_todos(db, project_id=project_id)


@router.post("", response_model=schemas.ColumnResponse, status_code=201)
def create_column(column: schemas.ColumnCreate, db: Session = Depends(get_db)):
    return crud.create_column(db, column)


@router.put("/{column_id}", response_model=schemas.ColumnResponse)
def update_column(column_id: int, column: schemas.ColumnUpdate, db: Session = Depends(get_db)):
    result = crud.update_column(db, column_id, column)
    if not result:
        raise HTTPException(status_code=404, detail="Column not found")
    return result


@router.delete("/{column_id}", status_code=204)
def delete_column(column_id: int, db: Session = Depends(get_db)):
    if not crud.delete_column(db, column_id):
        raise HTTPException(status_code=404, detail="Column not found")


@router.put("/reorder", status_code=200)
def reorder_columns(reorder: schemas.ColumnReorder, db: Session = Depends(get_db)):
    crud.reorder_columns(db, reorder.column_ids)
    return {"ok": True}
