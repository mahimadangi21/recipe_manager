from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class RecipeImage(Base):
    __tablename__ = "recipe_images"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"))
    url = Column(String(1000), nullable=False)
    is_primary = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    recipe = relationship("Recipe", back_populates="images")
