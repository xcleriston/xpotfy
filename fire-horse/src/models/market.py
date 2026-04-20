from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import Base

class MarketStatus(str, Enum):
    INACTIVE = "INACTIVE"
    OPEN = "OPEN"
    SUSPENDED = "SUSPENDED"
    CLOSED = "CLOSED"
    SETTLED = "SETTLED"
    CANCELLED = "CANCELLED"

class MarketType(str, Enum):
    WIN = "WIN"
    PLACE = "PLACE"
    EACH_WAY = "EACH_WAY"
    FORECAST = "FORECAST"
    TRICAST = "TRICAST"
    MATCH_ODDS = "MATCH_ODDS"
    CORRECT_SCORE = "CORRECT_SCORE"
    OVER_UNDER_25 = "OVER_UNDER_25"
    ASIAN_HANDICAP = "ASIAN_HANDICAP"

class Market(Base):
    """Market model for Betfair markets."""
    
    __tablename__ = "markets"
    
    id = Column(String(50), primary_key=True)  # Betfair market ID
    event_id = Column(String(50), ForeignKey("events.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    market_type = Column(SQLEnum(MarketType), nullable=False)
    market_time = Column(DateTime, nullable=False)
    status = Column(SQLEnum(MarketStatus), default=MarketStatus.INACTIVE, nullable=False)
    
    # Market details
    total_matched = Column(Float, default=0.0)  # Total amount matched on the market
    total_available = Column(Float, default=0.0)  # Total amount available to bet
    number_of_winners = Column(Integer, default=1)  # Number of winning selections
    
    # Betting parameters
    betting_type = Column(String(50), default="ODDS")  # ODDS, LINE, RANGE, ASIAN_HANDICAP_DOUBLE_LINE, etc.
    bet_delay = Column(Integer, default=0)  # Bet delay in seconds
    bsp_reconciled = Column(Boolean, default=False)  # Whether BSP reconciliation has been performed
    complete = Column(Boolean, default=False)  # Whether the market is complete
    in_play = Column(Boolean, default=False)  # Whether the market is currently in play
    
    # Relationships
    event = relationship("Event", back_populates="markets")
    runners = relationship("Runner", back_populates="market", cascade="all, delete-orphan")
    bets = relationship("Bet", back_populates="market", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Market {self.name} ({self.market_type})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte instância de mercado para dicionário."""
        return {
            "id": self.id,
            "event_id": self.event_id,
            "name": self.name,
            "market_type": self.market_type.value,
            "market_time": self.market_time.isoformat() if self.market_time else None,
            "status": self.status.value,
            "total_matched": self.total_matched,
            "total_available": self.total_available,
            "number_of_winners": self.number_of_winners,
            "betting_type": self.betting_type,
            "bet_delay": self.bet_delay,
            "bsp_reconciled": self.bsp_reconciled,
            "complete": self.complete,
            "in_play": self.in_play,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "runners": [runner.to_dict() for runner in self.runners] if hasattr(self, 'runners') else []
        }
