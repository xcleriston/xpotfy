from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import Base

class EventType(str, Enum):
    HORSE_RACING = "HORSE_RACING"
    FOOTBALL = "FOOTBALL"
    TENNIS = "TENNIS"
    GOLF = "GOLF"
    CRICKET = "CRICKET"
    RUGBY_UNION = "RUGBY_UNION"
    BOXING = "BOXING"
    HORSE_RACING_VIRTUAL = "HORSE_RACING_VIRTUAL"
    GREYHOUND_RACING = "GREYHOUND_RACING"
    GREYHOUND_RACING_VIRTUAL = "GREYHOUND_RACING_VIRTUAL"

class EventStatus(str, Enum):
    INACTIVE = "INACTIVE"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    FINISHED = "FINISHED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"

class Event(Base):
    """Event model for Betfair events."""
    
    __tablename__ = "events"
    
    id = Column(String(50), primary_key=True)  # Betfair event ID
    name = Column(String(255), nullable=False)
    country_code = Column(String(10), nullable=True)
    timezone = Column(String(50), default="UTC")
    venue = Column(String(255), nullable=True)
    open_date = Column(DateTime, nullable=False)
    event_type = Column(SQLEnum(EventType), nullable=False)
    status = Column(SQLEnum(EventStatus), default=EventStatus.INACTIVE, nullable=False)
    
    # Additional event details
    market_count = Column(Integer, default=0)  # Number of markets in the event
    sport = Column(String(100), nullable=True)  # e.g., "Horse Racing", "Soccer"
    competition = Column(String(100), nullable=True)  # e.g., "Premier League"
    
    # Relationships
    markets = relationship("Market", back_populates="event", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Event {self.name} ({self.event_type})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event instance to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "country_code": self.country_code,
            "timezone": self.timezone,
            "venue": self.venue,
            "open_date": self.open_date.isoformat() if self.open_date else None,
            "event_type": self.event_type.value,
            "status": self.status.value,
            "market_count": self.market_count,
            "sport": self.sport,
            "competition": self.competition,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "markets": [market.to_dict() for market in self.markets] if hasattr(self, 'markets') else []
        }
