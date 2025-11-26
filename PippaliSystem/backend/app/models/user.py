from sqlalchemy import Column, Integer, String, Boolean, Enum
import enum
from app.db.session import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    CUSTOMER = "CUSTOMER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True) # Staff might use PINs later, but email for Admin
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER)
    is_active = Column(Boolean, default=True)
