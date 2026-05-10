from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class RecipeSubmission(Base):
    __tablename__ = "recipe_submissions"

    id = Column(Integer, primary_key=True, index=True)
    submitter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    payload = Column(JSON, nullable=False)
    status = Column(String(20), default="pending", index=True)  # pending|approved|rejected
    admin_notes = Column(String(500), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    submitter = relationship("User", foreign_keys=[submitter_id])
