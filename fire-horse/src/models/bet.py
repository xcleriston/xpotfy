from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.orm.session import object_session

from .base import Base

class BetStatus(str, Enum):
    PENDING = "PENDING"
    MATCHED = "MATCHED"
    CANCELLED = "CANCELLED"
    LAPSED = "LAPSED"
    SETTLED = "SETTLED"
    VOIDED = "VOIDED"

class BetSide(str, Enum):
    BACK = "BACK"
    LAY = "LAY"

class BetPersistenceType(str, Enum):
    LAPSE = "LAPSE"
    PERSIST = "PERSIST"
    MARKET_ON_CLOSE = "MARKET_ON_CLOSE"

class BetOrderType(str, Enum):
    LIMIT = "LIMIT"
    LIMIT_ON_CLOSE = "LIMIT_ON_CLOSE"
    MARKET_ON_CLOSE = "MARKET_ON_CLOSE"

class Bet(Base):
    """Bet model for tracking individual bets."""
    
    __tablename__ = "bets"
    
    id = Column(String(50), primary_key=True, index=True)  # Betfair bet ID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True)
    market_id = Column(String(50), index=True, nullable=False)
    runner_id = Column(Integer, index=True, nullable=False)  # Selection ID in Betfair
    
    # Bet details
    bet_type = Column(String(10), nullable=False)  # BACK or LAY
    status = Column(SQLEnum(BetStatus), default=BetStatus.PENDING, nullable=False)
    price = Column(Float, nullable=False)  # Odds
    size = Column(Float, nullable=False)  # Stake amount
    bsp_liability = Column(Float, nullable=True)  # BSP liability if applicable
    
    # Betfair specific fields
    side = Column(SQLEnum(BetSide), default=BetSide.BACK, nullable=False)
    persistence_type = Column(SQLEnum(BetPersistenceType), default=BetPersistenceType.LAPSE, nullable=False)
    order_type = Column(SQLEnum(BetOrderType), default=BetOrderType.LIMIT, nullable=False)
    reference_order = Column(String(100), nullable=True)  # For linking related bets
    
    # Settlement fields
    settled_date = Column(DateTime, nullable=True)
    profit_loss = Column(Float, nullable=True)  # Positive for profit, negative for loss
    
    # Betfair response data
    betfair_id = Column(String(50), nullable=True)  # Unique bet identifier from Betfair
    market_version = Column(Integer, nullable=True)
    customer_order_ref = Column(String(100), nullable=True)
    customer_strategy_ref = Column(String(100), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="bets")
    account = relationship("Account", back_populates="bets")
    strategy = relationship("Strategy", back_populates="bets")
    
    def __repr__(self) -> str:
        return f"<Bet {self.id} - {self.bet_type} {self.size} @ {self.price}>"
    
    @property
    def stake(self) -> float:
        """Obter o valor da aposta."""
        return self.size
    
    @property
    def potential_payout(self) -> float:
        """Calcular o valor do pagamento potencial."""
        if self.bet_type == "BACK":
            return self.size * (self.price - 1) if self.price > 1 else 0
        else:  # LAY
            return self.size * (1 - 1/self.price) if self.price > 1 else 0
    
    @property
    def liability(self) -> float:
        """Calcular o valor da responsabilidade."""
        if self.bet_type == "BACK":
            return self.size
        else:  # LAY
            return self.size * (self.price - 1)
    
    def to_dict(self) -> Dict[str, Any]:
        """Converter a instância da aposta em dicionário."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "account_id": self.account_id,
            "strategy_id": self.strategy_id,
            "market_id": self.market_id,
            "runner_id": self.runner_id,
            "bet_type": self.bet_type,
            "status": self.status.value,
            "price": self.price,
            "size": self.size,
            "stake": self.stake,
            "potential_payout": self.potential_payout,
            "liability": self.liability,
            "side": self.side.value,
            "persistence_type": self.persistence_type.value,
            "order_type": self.order_type.value,
            "reference_order": self.reference_order,
            "settled_date": self.settled_date.isoformat() if self.settled_date else None,
            "profit_loss": self.profit_loss,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update_status(self, new_status: BetStatus, profit_loss: float = None) -> None:
        """Atualiza o status da aposta e, se necessário, define o lucro/perda."""
        self.status = new_status
        
        if new_status == BetStatus.SETTLED and profit_loss is not None:
            self.profit_loss = profit_loss
            self.settled_date = datetime.utcnow()
            
            # Update the associated strategy's performance metrics
            if self.strategy_id:
                session = object_session(self)
                if session:
                    strategy = session.query(Strategy).get(self.strategy_id)
                    if strategy:
                        strategy.update_performance_metrics()
        
        # Update the bet in the database
        session = object_session(self)
        if session:
            session.add(self)
            session.commit()
