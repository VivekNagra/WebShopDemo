from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from app.models.order import OrderType, OrderSource, OrderStatus

class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = 1
    notes: Optional[str] = None

class OrderCreate(BaseModel):
    type: OrderType = OrderType.DINE_IN
    source: OrderSource = OrderSource.POS
    table_number: Optional[str] = None
    customer_name: Optional[str] = None
    items: List[OrderItemCreate]

class OrderItem(OrderItemCreate):
    id: str
    menu_item_name: str
    unit_price: Decimal
    total_price: Decimal

    class Config:
        from_attributes = True

class Order(BaseModel):
    id: str
    order_number: Optional[int] = None
    type: OrderType
    source: OrderSource
    status: OrderStatus
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItem] = []

    class Config:
        from_attributes = True
