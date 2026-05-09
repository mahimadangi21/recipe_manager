from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base

collection_recipes = Table(
    "collection_recipes",
    Base.metadata,
    Column("collection_id", Integer, ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True),
    Column("recipe_id", Integer, ForeignKey("recipes.id", ondelete="CASCADE"), primary_key=True),
    Column("added_at", DateTime, default=lambda: datetime.now(timezone.utc))
)

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="collections")
    recipes = relationship("Recipe", secondary=collection_recipes, back_populates="collections")
