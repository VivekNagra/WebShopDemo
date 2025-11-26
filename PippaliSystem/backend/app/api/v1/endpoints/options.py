from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.option import OptionGroup, Option
from app.schemas.option import OptionGroupCreate, OptionGroup as OptionGroupSchema, OptionCreate, Option as OptionSchema

router = APIRouter()

# --- Option Groups ---

@router.get("/", response_model=List[OptionGroupSchema])
def read_option_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    groups = db.query(OptionGroup).order_by(OptionGroup.sort_order).offset(skip).limit(limit).all()
    return groups

@router.post("/", response_model=OptionGroupSchema)
def create_option_group(group: OptionGroupCreate, db: Session = Depends(get_db)):
    db_group = OptionGroup(
        name=group.name,
        slug=group.slug,
        is_required=group.is_required,
        allows_multiple=group.allows_multiple,
        sort_order=group.sort_order,
        is_active=group.is_active
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Create nested options if any
    for option_data in group.options:
        db_option = Option(**option_data.dict(), option_group_id=db_group.id)
        db.add(db_option)
    
    db.commit()
    db.refresh(db_group)
    return db_group

@router.get("/{group_id}", response_model=OptionGroupSchema)
def read_option_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(OptionGroup).filter(OptionGroup.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=404, detail="Option Group not found")
    return group

@router.delete("/{group_id}")
def delete_option_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(OptionGroup).filter(OptionGroup.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=404, detail="Option Group not found")
    db.delete(group)
    db.commit()
    return {"message": "Option Group deleted"}

# --- Options ---

@router.post("/{group_id}/options/", response_model=OptionSchema)
def create_option(group_id: int, option: OptionCreate, db: Session = Depends(get_db)):
    group = db.query(OptionGroup).filter(OptionGroup.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=404, detail="Option Group not found")
    
    db_option = Option(**option.dict(), option_group_id=group_id)
    db.add(db_option)
    db.commit()
    db.refresh(db_option)
    return db_option

@router.delete("/options/{option_id}")
def delete_option(option_id: int, db: Session = Depends(get_db)):
    option = db.query(Option).filter(Option.id == option_id).first()
    if option is None:
        raise HTTPException(status_code=404, detail="Option not found")
    db.delete(option)
    db.commit()
    return {"message": "Option deleted"}
