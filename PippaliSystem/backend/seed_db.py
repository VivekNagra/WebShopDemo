from app.db.session import SessionLocal, engine, Base
from app.models.menu import MenuItem
from app.models.category import Category
from app.models import option, bundle, order # Ensure all models are loaded
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_data():
    # Drop all tables to start fresh with new schema
    logger.info("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    logger.info("Creating all tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # 1. Create Categories
    logger.info("Creating categories...")
    cat_starters = Category(name="Starters", slug="starters", sort_order=1)
    cat_mains = Category(name="Mains", slug="mains", sort_order=2)
    cat_breads = Category(name="Breads", slug="breads", sort_order=3)
    cat_drinks = Category(name="Drinks", slug="drinks", sort_order=4)
    
    db.add_all([cat_starters, cat_mains, cat_breads, cat_drinks])
    db.commit()
    
    # Refresh to get IDs
    db.refresh(cat_starters)
    db.refresh(cat_mains)
    db.refresh(cat_breads)
    db.refresh(cat_drinks)

    # 2. Create Menu Items
    logger.info("Creating menu items...")
    items = [
        MenuItem(
            name="Samosa Chaat",
            description="Crispy samosas topped with tangy chutneys and yogurt.",
            base_price=65.00,
            category_id=cat_starters.id,
            is_vegetarian=True,
            sort_order=1
        ),
        MenuItem(
            name="Butter Chicken",
            description="Tender chicken in a rich, creamy tomato sauce.",
            base_price=149.00,
            category_id=cat_mains.id,
            is_gluten_free=True,
            sort_order=1
        ),
        MenuItem(
            name="Lamb Rogan Josh",
            description="Aromatic lamb curry with Kashmiri spices.",
            base_price=169.00,
            category_id=cat_mains.id,
            is_gluten_free=True,
            sort_order=2
        ),
        MenuItem(
            name="Paneer Tikka Masala",
            description="Grilled cottage cheese in a spiced gravy.",
            base_price=139.00,
            category_id=cat_mains.id,
            is_vegetarian=True,
            is_gluten_free=True,
            sort_order=3
        ),
        MenuItem(
            name="Garlic Naan",
            description="Leavened bread topped with fresh garlic and cilantro.",
            base_price=35.00,
            category_id=cat_breads.id,
            is_vegetarian=True,
            sort_order=1
        ),
        MenuItem(
            name="Mango Lassi",
            description="Refreshing yogurt drink with mango pulp.",
            base_price=45.00,
            category_id=cat_drinks.id,
            is_vegetarian=True,
            is_gluten_free=True,
            sort_order=1
        )
    ]

    db.add_all(items)
    db.commit()
    
    logger.info("Database seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_data()
