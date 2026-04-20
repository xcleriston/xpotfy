from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import Base

class Account(Base):
    """Account model for managing Betfair accounts."""
    
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_name = Column(String(100), nullable=False)
    account_type = Column(String(50), default="betfair")
    api_key = Column(String(255), nullable=True)
    username = Column(String(100), nullable=True)
    password = Column(String(255), nullable=True)  # Should be encrypted in production
    is_active = Column(Boolean(), default=True)
    balance = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    last_synced = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="accounts")
    strategies = relationship("Strategy", back_populates="account", cascade="all, delete-orphan")
    bets = relationship("Bet", back_populates="account", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Account {self.account_name} ({self.account_type})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert account instance to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "account_name": self.account_name,
            "account_type": self.account_type,
            "is_active": self.is_active,
            "balance": self.balance,
            "currency": self.currency,
            "last_synced": self.last_synced.isoformat() if self.last_synced else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
