from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/task-types", tags=["task-types"])


@router.get("", response_model=list[schemas.TaskTypeResponse])
def list_task_types(db: Session = Depends(get_db)):
    return crud.get_task_types(db)


@router.post("", response_model=schemas.TaskTypeResponse, status_code=201)
def create_task_type(task_type: schemas.TaskTypeCreate, db: Session = Depends(get_db)):
    return crud.create_task_type(db, task_type)


@router.put("/{task_type_id}", response_model=schemas.TaskTypeResponse)
def update_task_type(task_type_id: int, task_type: schemas.TaskTypeUpdate, db: Session = Depends(get_db)):
    result = crud.update_task_type(db, task_type_id, task_type)
    if not result:
        raise HTTPException(status_code=404, detail="TaskType not found")
    return result


@router.delete("/{task_type_id}", status_code=204)
def delete_task_type(task_type_id: int, db: Session = Depends(get_db)):
    if not crud.delete_task_type(db, task_type_id):
        raise HTTPException(status_code=404, detail="TaskType not found")
