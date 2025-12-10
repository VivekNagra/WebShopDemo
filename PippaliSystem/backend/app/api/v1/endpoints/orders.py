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

# --- Split Bill Logic ---
from pydantic import BaseModel

class TargetSplit(BaseModel):
    table_id: int
    item_ids: List[int] # IDs of OrderItems to move

class SplitRequest(BaseModel):
    source_table_id: int
    target_splits: List[TargetSplit]

@router.post("/split")
def split_order(request: SplitRequest, db: Session = Depends(get_db)):
    # 1. Find Source Order (Active)
    # Assuming "Active" means status is not 'COMPLETED' or 'CANCELLED'
    # For now, just pick the latest order for the table
    source_order = db.query(Order).filter(
        Order.table_number == str(request.source_table_id),
        Order.status == "PENDING" # Or whatever default status is
    ).order_by(Order.created_at.desc()).first()

    if not source_order:
        # Try finding by ID if table_number is actually table ID? 
        # Frontend sends table ID usually. Let's assume table_number stores ID as string for now based on previous code.
        raise HTTPException(status_code=404, detail="No active order found for source table")

    for split in request.target_splits:
        if not split.item_ids:
            continue

        # 2. Get or Create Target Order
        # Check if target table already has an active order
        target_order = db.query(Order).filter(
            Order.table_number == str(split.table_id),
            Order.status == "PENDING"
        ).first()

        if not target_order:
            target_order = Order(
                type=source_order.type,
                source=source_order.source,
                table_number=str(split.table_id),
                customer_name=f"Split from Table {request.source_table_id}",
                status="PENDING"
            )
            db.add(target_order)
            db.flush() # Get ID

        # 3. Move Items
        items_to_move = db.query(OrderItem).filter(
            OrderItem.id.in_(split.item_ids),
            OrderItem.order_id == source_order.id
        ).all()

        moved_amount = 0
        for item in items_to_move:
            item.order_id = target_order.id
            moved_amount += item.total_price
        
        # 4. Update Totals
        target_order.total_amount = (target_order.total_amount or 0) + moved_amount
        source_order.total_amount -= moved_amount

    db.commit()
    
    # 5. Cleanup Source if Empty
    remaining_items = db.query(OrderItem).filter(OrderItem.order_id == source_order.id).count()
    if remaining_items == 0:
        source_order.status = "CANCELLED" # or delete?
        # Let's mark as cancelled/split so we keep history but it's not "active"
        source_order.notes = "Fully split to other tables"
    
    db.commit()
    return {"message": "Order split successfully"}
