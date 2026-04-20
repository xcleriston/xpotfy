from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import Base
from .runner_odds import RunnerOdds

class RunnerStatus(str, Enum):
    ACTIVE = "ACTIVE"
    WINNER = "WINNER"
    LOSER = "LOSER"
    REMOVED = "REMOVED"  # Removed from the market
    PLACED = "PLACED"    # Finished in a placed position
    HIDDEN = "HIDDEN"    # Hidden from the market

class Runner(Base):
    """Runner model for market selections (e.g., horses, teams, players)."""
    
    __tablename__ = "runners"
    
    id = Column(Integer, primary_key=True)  # Betfair selection ID
    market_id = Column(String(50), ForeignKey("markets.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    handicap = Column(Float, default=0.0)  # Handicap value (0 for non-handicap markets)
    sort_priority = Column(Integer, default=0)  # Display order
    status = Column(SQLEnum(RunnerStatus), default=RunnerStatus.ACTIVE, nullable=False)
    
    # Runner details
    selection_id = Column(Integer, nullable=False)  # Betfair's selection ID
    runner_number = Column(Integer, nullable=True)  # Runner number (for horse racing)
    jockey = Column(String(100), nullable=True)     # Jockey name (for horse racing)
    trainer = Column(String(100), nullable=True)    # Trainer name (for horse racing)
    
    # Odds and trading information
    last_price_traded = Column(Float, nullable=True)  # Last matched price
    total_matched = Column(Float, default=0.0)       # Total amount matched on this runner
    
    # Relationships
    market = relationship("Market", back_populates="runners")
    odds = relationship("RunnerOdds", back_populates="runner", cascade="all, delete-orphan")
    bets = relationship("Bet", back_populates="runner", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Runner {self.name} (ID: {self.id})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert runner instance to dictionary."""
        return {
            "id": self.id,
            "market_id": self.market_id,
            "name": self.name,
            "handicap": self.handicap,
            "sort_priority": self.sort_priority,
            "status": self.status.value,
            "selection_id": self.selection_id,
            "runner_number": self.runner_number,
            "jockey": self.jockey,
            "trainer": self.trainer,
            "last_price_traded": self.last_price_traded,
            "total_matched": self.total_matched,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


