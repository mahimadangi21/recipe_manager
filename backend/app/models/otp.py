from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime, timedelta, timezone
from app.database import Base

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    otp = Column(String(6), nullable=False)
    type = Column(String(20), nullable=False) # 'signup' or 'reset'
    payload = Column(String(2000), nullable=True) # JSON string for pending data
    attempts = Column(Integer, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    @property
    def is_expired(self) -> bool:
        now = datetime.now(timezone.utc)
        expiry = self.expires_at
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        return now > expiry

    @property
    def too_many_attempts(self) -> bool:
        return self.attempts >= 5
