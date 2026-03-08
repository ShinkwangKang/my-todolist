from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=list[schemas.TagResponse])
def list_tags(db: Session = Depends(get_db)):
    return crud.get_tags(db)


@router.post("", response_model=schemas.TagResponse, status_code=201)
def create_tag(tag: schemas.TagCreate, db: Session = Depends(get_db)):
    return crud.create_tag(db, tag)


@router.put("/{tag_id}", response_model=schemas.TagResponse)
def update_tag(tag_id: int, tag: schemas.TagUpdate, db: Session = Depends(get_db)):
    result = crud.update_tag(db, tag_id, tag)
    if not result:
        raise HTTPException(status_code=404, detail="Tag not found")
    return result


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    if not crud.delete_tag(db, tag_id):
        raise HTTPException(status_code=404, detail="Tag not found")
