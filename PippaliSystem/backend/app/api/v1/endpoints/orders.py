from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.order import Order, OrderItem
from app.models.menu import MenuItem
from app.schemas.order import OrderCreate, Order as OrderSchema

router = APIRouter()

@router.post("/", response_model=OrderSchema)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    # 1. Create the Order shell
    db_order = Order(
        type=order_in.type,
        source=order_in.source,
        table_number=order_in.table_number,
        customer_name=order_in.customer_name
    )
    db.add(db_order)
    db.flush() # Generate ID

    total_amount = 0

    # 2. Process Items
    for item_in in order_in.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item_in.menu_item_id).first()
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item {item_in.menu_item_id} not found")
        
        # Calculate price (snapshot)
        unit_price = menu_item.base_price
        item_total = unit_price * item_in.quantity
        total_amount += item_total

        db_item = OrderItem(
            order_id=db_order.id,
            menu_item_id=menu_item.id,
            menu_item_name=menu_item.name,
            quantity=item_in.quantity,
            unit_price=unit_price,
            total_price=item_total,
            notes=item_in.notes
        )
        db.add(db_item)

    # 3. Update Order Total
    db_order.total_amount = total_amount
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/", response_model=List[OrderSchema])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = db.query(Order).offset(skip).limit(limit).all()
    return orders
