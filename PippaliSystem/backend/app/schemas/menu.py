from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    slug: str
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True

from app.schemas.option import OptionGroup

# Menu Item Schemas
class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_price: Decimal
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    
    dish_type: Optional[str] = None
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_gluten_free: bool = False
    
    is_active: bool = True
    is_available: bool = True
    sort_order: int = 0

class MenuItemCreate(MenuItemBase):
    option_group_ids: List[int] = []

class MenuItem(MenuItemBase):
    id: int
    category: Optional[Category] = None
    option_groups: List[OptionGroup] = []

    class Config:
        orm_mode = True
