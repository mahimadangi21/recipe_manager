from datetime import date, datetime, timezone
from sqlalchemy import Column, Integer, Date, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class MealPlanItem(Base):
    __tablename__ = "meal_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_date = Column(Date, nullable=False, default=date.today)
    meal_type = Column(String(20), nullable=False, default="dinner")
    servings = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    recipe = relationship("Recipe")
