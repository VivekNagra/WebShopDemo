from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base

class MenuBundle(Base):
    __tablename__ = "menu_bundles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    base_price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    # Relationships
    components = relationship("MenuBundleComponent", back_populates="bundle", cascade="all, delete-orphan")

class MenuBundleComponent(Base):
    __tablename__ = "menu_bundle_components"

    id = Column(Integer, primary_key=True, index=True)
    bundle_id = Column(Integer, ForeignKey("menu_bundles.id", ondelete="CASCADE"), nullable=False)
    
    component_type = Column(String(32), nullable=False) # starter, main, etc.
    
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=True)
    allowed_category_id = Column(Integer, ForeignKey("menu_categories.id"), nullable=True)
    
    required = Column(Boolean, default=True, nullable=False)
    min_quantity = Column(Integer, default=1, nullable=False)
    max_quantity = Column(Integer, default=1, nullable=False)

    # Relationships
    bundle = relationship("MenuBundle", back_populates="components")
    menu_item = relationship("MenuItem")
    allowed_category = relationship("Category")

    __table_args__ = (
        CheckConstraint('menu_item_id IS NOT NULL OR allowed_category_id IS NOT NULL', name='chk_bundle_component_target'),
    )
