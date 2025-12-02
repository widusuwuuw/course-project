from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.sql.expression import text
from sqlalchemy.orm import relationship

from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Notification Settings
    new_log_alerts = Column(Boolean, server_default=text('true'), nullable=False)
    achievement_alerts = Column(Boolean, server_default=text('true'), nullable=False)
    weekly_summary = Column(Boolean, server_default=text('false'), nullable=False)
    assistant_updates = Column(Boolean, server_default=text('true'), nullable=False)

    logs = relationship("HealthLog", back_populates="user", cascade="all, delete-orphan")


class HealthLog(Base):
    __tablename__ = "health_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    metric_type = Column(String(50), nullable=False, default="weight")
    value1 = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False, default="kg")
    logged_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="logs")
