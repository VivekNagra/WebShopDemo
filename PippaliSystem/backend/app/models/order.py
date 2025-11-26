import uuid
from sqlalchemy import Column, String, Enum, Numeric, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.session import Base

class OrderType(str, enum.Enum):
    DINE_IN = "DINE_IN"
    TAKEAWAY = "TAKEAWAY"
    DELIVERY = "DELIVERY"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PREPARING = "PREPARING"
    READY = "READY"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class OrderSource(str, enum.Enum):
    POS = "POS"
    WEB = "WEB"

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4())) # Using String for SQLite compatibility, normally UUID
    order_number = Column(Integer, autoincrement=True) # Simple auto-increment for daily order number
    type = Column(Enum(OrderType), default=OrderType.DINE_IN)
    source = Column(Enum(OrderSource), default=OrderSource.POS)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    
    total_amount = Column(Numeric(10, 2), default=0.00)
    table_number = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"))
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"))
    
    menu_item_name = Column(String) # Snapshot
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(10, 2)) # Snapshot
    total_price = Column(Numeric(10, 2))
    
    notes = Column(String, nullable=True)
    # selected_options = Column(JSON) # SQLite doesn't support JSON well without extensions, using String for now or simple JSON
    
    order = relationship("Order", back_populates="items")
