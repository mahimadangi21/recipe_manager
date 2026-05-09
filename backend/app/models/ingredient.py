from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"))
    name = Column(String(200), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    notes = Column(String(300), nullable=True)

    recipe = relationship("Recipe", back_populates="ingredients")
