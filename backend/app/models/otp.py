from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime, timedelta
from app.database import Base

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    otp = Column(String(6), nullable=False)
    type = Column(String(20), nullable=False) # 'signup' or 'reset'
    payload = Column(String(2000), nullable=True) # JSON string for pending data
    attempts = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at

    @property
    def too_many_attempts(self) -> bool:
        return self.attempts >= 5
