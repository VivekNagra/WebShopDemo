from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship, backref
from app.db.session import Base

class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, index=True)
    capacity = Column(Integer, default=4)
    is_occupied = Column(Boolean, default=False)
    
    # Table Joining
    parent_id = Column(Integer, ForeignKey("tables.id"), nullable=True)
    
    # Drag-and-Drop Layout
    position_x = Column(Float, default=0.0) # Percentage 0-100
    position_y = Column(Float, default=0.0) # Percentage 0-100
    shape = Column(String, default="rectangle") # "rectangle" or "circle"

    # Snap Back Logic
    original_x = Column(Float, nullable=True)
    original_y = Column(Float, nullable=True)

    children = relationship("Table", backref=backref('parent', remote_side=[id]))
