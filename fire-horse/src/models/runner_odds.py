from datetime import datetime
from typing import Any, Dict

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from .base import Base

class RunnerOdds(Base):
    """Historical odds data for runners."""
    
    __tablename__ = "runner_odds"
    
    id = Column(Integer, primary_key=True)
    runner_id = Column(Integer, ForeignKey("runners.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Price data
    last_price_traded = Column(Float, nullable=True)
    total_matched = Column(Float, default=0.0)
    
    # Available to back prices (best 3)
    atb1_price = Column(Float, nullable=True)
    atb1_size = Column(Float, nullable=True)
    atb2_price = Column(Float, nullable=True)
    atb2_size = Column(Float, nullable=True)
    atb3_price = Column(Float, nullable=True)
    atb3_size = Column(Float, nullable=True)
    
    # Available to lay prices (best 3)
    atl1_price = Column(Float, nullable=True)
    atl1_size = Column(Float, nullable=True)
    atl2_price = Column(Float, nullable=True)
    atl2_size = Column(Float, nullable=True)
    atl3_price = Column(Float, nullable=True)
    atl3_size = Column(Float, nullable=True)
    
    # Starting prices (if available)
    sp_near_price = Column(Float, nullable=True)
    sp_far_price = Column(Float, nullable=True)
    
    # Relationships
    runner = relationship("Runner", back_populates="odds")
    
    def __repr__(self) -> str:
        return f"<RunnerOdds {self.runner_id} @ {self.timestamp}>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert runner odds instance to dictionary."""
        return {
            "id": self.id,
            "runner_id": self.runner_id,
            "timestamp": self.timestamp.isoformat(),
            "last_price_traded": self.last_price_traded,
            "total_matched": self.total_matched,
            "available_to_back": [
                {"price": self.atb1_price, "size": self.atb1_size} if self.atb1_price and self.atb1_size else None,
                {"price": self.atb2_price, "size": self.atb2_size} if self.atb2_price and self.atb2_size else None,
                {"price": self.atb3_price, "size": self.atb3_size} if self.atb3_price and self.atb3_size else None
            ],
            "available_to_lay": [
                {"price": self.atl1_price, "size": self.atl1_size} if self.atl1_price and self.atl1_size else None,
                {"price": self.atl2_price, "size": self.atl2_size} if self.atl2_price and self.atl2_size else None,
                {"price": self.atl3_price, "size": self.atl3_size} if self.atl3_price and self.atl3_size else None
            ],
            "starting_prices": {
                "near_price": self.sp_near_price,
                "far_price": self.sp_far_price
            } if self.sp_near_price or self.sp_far_price else None
        }
