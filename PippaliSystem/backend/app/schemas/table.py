from pydantic import BaseModel
from typing import Optional, List

class TableBase(BaseModel):
    number: str
    capacity: int = 4
    is_occupied: bool = False
    parent_id: Optional[int] = None
    position_x: float = 0.0
    position_y: float = 0.0
    shape: str = "rectangle"
    original_x: Optional[float] = None
    original_y: Optional[float] = None

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    number: Optional[str] = None
    capacity: Optional[int] = None
    is_occupied: Optional[bool] = None
    parent_id: Optional[int] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    shape: Optional[str] = None

class Table(TableBase):
    id: int
    children: List['Table'] = []

    class Config:
        orm_mode = True

# Resolve forward reference
Table.update_forward_refs()
