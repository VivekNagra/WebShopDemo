from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def create_admin():
    db = SessionLocal()
    
    email = "admin@pippali.com"
    password = "admin" # Change this in production!
    
    # Check if admin exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"Admin user {email} already exists.")
        return

    admin_user = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name="System Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    
    db.add(admin_user)
    db.commit()
    print(f"Successfully created admin user: {email}")
    db.close()

if __name__ == "__main__":
    create_admin()
