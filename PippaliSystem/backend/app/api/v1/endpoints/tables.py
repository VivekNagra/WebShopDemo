from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.models.table import Table
from app.schemas.table import TableCreate, TableUpdate, Table as TableSchema

router = APIRouter()

@router.get("", response_model=List[TableSchema])
def read_tables(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Sort by number naturally if possible, or just string sort
    tables = db.query(Table).order_by(Table.number).offset(skip).limit(limit).all()
    return tables

@router.post("", response_model=TableSchema)
def create_table(table: TableCreate, db: Session = Depends(get_db)):
    db_table = db.query(Table).filter(Table.number == table.number).first()
    if db_table:
        raise HTTPException(status_code=400, detail="Table already exists")
    db_table = Table(**table.dict())
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    return db_table

@router.put("/{table_id}", response_model=TableSchema)
def update_table(table_id: int, table: TableUpdate, db: Session = Depends(get_db)):
    db_table = db.query(Table).filter(Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    update_data = table.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_table, key, value)

    db.commit()
    db.refresh(db_table)
    return db_table

@router.delete("/{table_id}")
def delete_table(table_id: int, db: Session = Depends(get_db)):
    db_table = db.query(Table).filter(Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    db.delete(db_table)
    db.commit()
    return {"message": "Table deleted"}

# --- Table Joining Logic ---

class JoinRequest(BaseModel):
    table_ids: List[int]

@router.post("/join")
def join_tables(request: JoinRequest, db: Session = Depends(get_db)):
    tables = db.query(Table).filter(Table.id.in_(request.table_ids)).all()
    if len(tables) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 tables to join")
    
    # Sort by ID to pick a consistent parent (e.g., lowest ID)
    tables.sort(key=lambda t: t.id)
    parent = tables[0]
    children = tables[1:]
    
    # Save original positions if not already saved
    # (In case of re-joining or multi-step joining)
    for t in tables:
        if t.original_x is None:
            t.original_x = t.position_x
        if t.original_y is None:
            t.original_y = t.position_y

    for child in children:
        child.parent_id = parent.id
        child.is_occupied = parent.is_occupied # Sync status
    
    db.commit()
    return {"message": f"Tables joined under Table {parent.number}", "parent_id": parent.id}

class DisjoinRequest(BaseModel):
    target_table_id: Optional[int] = None # If transferring all items to one table
    remove_table_ids: Optional[List[int]] = None # Specific tables to remove from group

@router.post("/{table_id}/disjoin")
def disjoin_table(table_id: int, request: DisjoinRequest, db: Session = Depends(get_db)):
    # Find the table (could be parent or child)
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    # If it's a child, find the parent
    parent_id = table.parent_id if table.parent_id else table.id
    
    # Find all tables in this group
    group = db.query(Table).filter((Table.id == parent_id) | (Table.parent_id == parent_id)).all()
    
    if len(group) <= 1:
         raise HTTPException(status_code=400, detail="Table is not joined")

    # Logic: Reset parent_id for specified tables OR all tables
    
    tables_to_remove = []
    if request.remove_table_ids:
        # Filter group for these IDs
        tables_to_remove = [t for t in group if t.id in request.remove_table_ids]
        # Ensure we don't remove the parent if it's the anchor?
        # Actually, if parent is removed, we might need to reassign parent?
        # For simplicity: If parent is removed, disband whole group OR assign new parent.
        # Let's stick to: If parent is in removal list, disband whole group for safety/simplicity.
        if any(t.id == parent_id for t in tables_to_remove):
             tables_to_remove = group # Disband all
    else:
        tables_to_remove = group # Disband all

    for t in tables_to_remove:
        t.parent_id = None
        
        # Restore original position if exists
        if t.original_x is not None:
            t.position_x = t.original_x
            t.original_x = None
        
        if t.original_y is not None:
            t.position_y = t.original_y
            t.original_y = None

    db.commit()
    return {"message": "Tables disjoined and positions restored"}
