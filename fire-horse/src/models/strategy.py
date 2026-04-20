from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from .base import Base

class Strategy(Base):
    """Strategy model for managing betting strategies."""
    
    __tablename__ = "strategies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    strategy_type = Column(String(50), default="default")  # default, custom, etc.
    config = Column(JSON, default=dict)  # JSON configuration for the strategy
    is_active = Column(Boolean(), default=True)
    is_system = Column(Boolean(), default=False)  # System strategies cannot be deleted
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Strategy performance metrics
    total_bets = Column(Integer, default=0)
    winning_bets = Column(Integer, default=0)
    losing_bets = Column(Integer, default=0)
    total_stake = Column(Float, default=0.0)
    total_payout = Column(Float, default=0.0)
    total_profit = Column(Float, default=0.0)
    win_rate = Column(Float, default=0.0)
    roi = Column(Float, default=0.0)  # Return on Investment
    
    # Relationships
    user = relationship("User", back_populates="strategies")
    account = relationship("Account", back_populates="strategies")
    bets = relationship("Bet", back_populates="strategy", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Strategy {self.name} ({self.strategy_type})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert strategy instance to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "account_id": self.account_id,
            "name": self.name,
            "description": self.description,
            "strategy_type": self.strategy_type,
            "config": self.config,
            "is_active": self.is_active,
            "is_system": self.is_system,
            "total_bets": self.total_bets,
            "winning_bets": self.winning_bets,
            "losing_bets": self.losing_bets,
            "total_stake": self.total_stake,
            "total_payout": self.total_payout,
            "total_profit": self.total_profit,
            "win_rate": self.win_rate,
            "roi": self.roi,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update_performance_metrics(self) -> None:
        """Update performance metrics based on associated bets."""
        from sqlalchemy import func
        from .bet import Bet, BetStatus
        
        # Get all settled bets for this strategy
        session = object_session(self)
        if not session:
            return
            
        settled_bets = session.query(Bet).filter(
            Bet.strategy_id == self.id,
            Bet.status == BetStatus.SETTLED.value
        ).all()
        
        # Calculate metrics
        self.total_bets = len(settled_bets)
        self.winning_bets = len([b for b in settled_bets if b.profit_loss and b.profit_loss > 0])
        self.losing_bets = len([b for b in settled_bets if b.profit_loss and b.profit_loss <= 0])
        
        self.total_stake = sum(b.stake for b in settled_bets if b.stake)
        self.total_payout = sum(b.payout for b in settled_bets if b.payout)
        self.total_profit = sum(b.profit_loss for b in settled_bets if b.profit_loss is not None)
        
        self.win_rate = (self.winning_bets / self.total_bets * 100) if self.total_bets > 0 else 0
        self.roi = (self.total_profit / self.total_stake * 100) if self.total_stake > 0 else 0
        
        # Update the strategy in the database
        session.add(self)
        session.commit()
