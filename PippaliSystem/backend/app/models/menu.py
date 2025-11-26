from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

from app.models.option import menu_item_option_groups # Import association table

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("menu_categories.id"), nullable=True) # Nullable for now, or strict? User SQL says nullable? No, user SQL says REFERENCES, implies nullable unless NOT NULL specified. User didn't specify NOT NULL on category_id in SQL but usually it is. Let's make it nullable for flexibility or follow SQL. User SQL: `category_id INT REFERENCES...`. It is nullable by default in SQL.
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    base_price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String, nullable=True)
    
    dish_type = Column(String, nullable=True) # e.g. CHICKEN, LAMB, SODA
    is_vegetarian = Column(Boolean, default=False, nullable=False)
    is_vegan = Column(Boolean, default=False, nullable=False)
    is_gluten_free = Column(Boolean, default=False, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    # Relationships
    category = relationship("Category", back_populates="items")
    option_groups = relationship("OptionGroup", secondary=menu_item_option_groups, back_populates="menu_items")
