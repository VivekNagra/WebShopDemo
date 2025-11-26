from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

# Option Schemas
class OptionBase(BaseModel):
    name: str
    price_delta: Decimal = Decimal('0.00')
    sort_order: int = 0
    is_active: bool = True

class OptionCreate(OptionBase):
    pass

class Option(OptionBase):
    id: int
    option_group_id: int

    class Config:
        orm_mode = True

# Option Group Schemas
class OptionGroupBase(BaseModel):
    name: str
    slug: str
    is_required: bool = False
    allows_multiple: bool = False
    sort_order: int = 0
    is_active: bool = True

class OptionGroupCreate(OptionGroupBase):
    options: List[OptionCreate] = []

class OptionGroup(OptionGroupBase):
    id: int
    options: List[Option] = []

    class Config:
        orm_mode = True
