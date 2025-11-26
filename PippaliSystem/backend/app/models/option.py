from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.session import Base

# Many-to-Many association table
menu_item_option_groups = Table(
    'menu_item_option_groups',
    Base.metadata,
    Column('menu_item_id', Integer, ForeignKey('menu_items.id', ondelete="CASCADE"), primary_key=True),
    Column('option_group_id', Integer, ForeignKey('option_groups.id', ondelete="CASCADE"), primary_key=True)
)

class OptionGroup(Base):
    __tablename__ = "option_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    is_required = Column(Boolean, default=False, nullable=False)
    allows_multiple = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    options = relationship("Option", back_populates="group", cascade="all, delete-orphan")
    menu_items = relationship("MenuItem", secondary=menu_item_option_groups, back_populates="option_groups")

class Option(Base):
    __tablename__ = "options"

    id = Column(Integer, primary_key=True, index=True)
    option_group_id = Column(Integer, ForeignKey("option_groups.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=True)
    price_delta = Column(Numeric(10, 2), default=0.00, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    group = relationship("OptionGroup", back_populates="options")
