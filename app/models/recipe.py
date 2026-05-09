import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
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

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=False)
    servings = Column(Integer, default=4, nullable=False)
    prep_time_minutes = Column(Integer, nullable=True)
    cook_time_minutes = Column(Integer, nullable=True)
    category = Column(Enum(CategoryEnum), nullable=False)
    difficulty = Column(Enum(DifficultyEnum), nullable=False)
    image_url = Column(String, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    notes = Column(String, nullable=True)

    recipe = relationship("Recipe", back_populates="ingredients")
