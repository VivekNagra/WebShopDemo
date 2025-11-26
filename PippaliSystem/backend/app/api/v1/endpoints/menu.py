from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.menu import MenuItem
from app.models.option import OptionGroup
from app.schemas.menu import MenuItemCreate, MenuItem as MenuItemSchema

router = APIRouter()

@router.get("/", response_model=List[MenuItemSchema])
def read_menu_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = db.query(MenuItem).order_by(MenuItem.category_id, MenuItem.sort_order).offset(skip).limit(limit).all()
    return items

@router.post("/", response_model=MenuItemSchema)
def create_menu_item(item: MenuItemCreate, db: Session = Depends(get_db)):
    # Extract option_group_ids
    option_group_ids = item.option_group_ids
    item_data = item.dict(exclude={'option_group_ids'})
    
    db_item = MenuItem(**item_data)
    
    # Link Option Groups
    if option_group_ids:
        groups = db.query(OptionGroup).filter(OptionGroup.id.in_(option_group_ids)).all()
        db_item.option_groups = groups
        
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{item_id}", response_model=MenuItemSchema)
def update_menu_item(item_id: int, item: MenuItemCreate, db: Session = Depends(get_db)):
    db_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Update fields
    item_data = item.dict(exclude={'option_group_ids'})
    for key, value in item_data.items():
        setattr(db_item, key, value)
    
    # Update Option Groups
    if item.option_group_ids is not None:
        groups = db.query(OptionGroup).filter(OptionGroup.id.in_(item.option_group_ids)).all()
        db_item.option_groups = groups
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    db.delete(db_item)
    db.commit()
    return {"message": "Menu item deleted"}
