from app.db.session import SessionLocal, engine, Base
from app.models.table import Table
from sqlalchemy import text

def seed_tables():
    # 1. Drop existing table to apply schema changes (Dev only!)
    with engine.connect() as connection:
        connection.execute(text("DROP TABLE IF EXISTS tables CASCADE"))
        connection.commit()
    
    # 2. Recreate table
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    
    # Check if tables exist (should be empty now)
    if db.query(Table).first():
        print("Tables already exist.")
        return

    print("Seeding tables...")
    tables = []
    # Grid Layout: 4 columns
    cols = 4
    for i in range(1, 13): # 12 Tables
        row = (i - 1) // cols
        col = (i - 1) % cols
        
        # Calculate percentage positions (approximate grid)
        # Margins: 10% left/top, spacing 20%
        pos_x = 10.0 + (col * 22.0)
        pos_y = 10.0 + (row * 22.0)
        
        tables.append(Table(
            number=str(i), 
            capacity=4 if i <= 8 else 6,
            position_x=pos_x,
            position_y=pos_y,
            shape="rectangle"
        ))
    
    db.add_all(tables)
    db.commit()
    print("Tables seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_tables()
