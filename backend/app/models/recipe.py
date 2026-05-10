import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base

class CategoryEnum(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    dessert = "dessert"
    snack = "snack"
    beverage = "beverage"
    other = "other"

class DifficultyEnum(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"

class RecipeStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=False)
    servings = Column(Integer, default=4, nullable=False)
    prep_time_minutes = Column(Integer, nullable=True)
    cook_time_minutes = Column(Integer, nullable=True)
    category = Column(Enum(CategoryEnum), default=CategoryEnum.other)
    difficulty = Column(Enum(DifficultyEnum), default=DifficultyEnum.medium)
    status = Column(Enum(RecipeStatus), default=RecipeStatus.pending)
    is_public = Column(Boolean, default=True)
    share_token = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(Integer, ForeignKey("users.id"))
    submitted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    copied_from_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="recipes", foreign_keys=[owner_id])
    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan", lazy="selectin")
    images = relationship("RecipeImage", back_populates="recipe", cascade="all, delete-orphan", lazy="selectin")
    reviews = relationship("Review", back_populates="recipe", cascade="all, delete-orphan")
    collections = relationship("Collection", secondary="collection_recipes", back_populates="recipes")
    copied_from = relationship("Recipe", remote_side=[id])
