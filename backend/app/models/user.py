from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(1000), nullable=True)
    bio = Column(String(300), nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(String(20), default="user") # "user" or "admin"
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    recipes = relationship("Recipe", back_populates="owner", foreign_keys="Recipe.owner_id")
    collections = relationship("Collection", back_populates="owner")
    reviews = relationship("Review", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    @property
    def is_admin(self) -> bool:
        return self.role == "admin"
