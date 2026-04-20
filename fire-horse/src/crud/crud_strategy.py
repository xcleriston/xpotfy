from typing import Any, Dict, List, Optional, Union

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from ..crud.base import CRUDBase
from ..models.strategy import Strategy
from ..schemas.strategy import StrategyCreate, StrategyUpdate

class CRUDStrategy(CRUDBase[Strategy, StrategyCreate, StrategyUpdate]):
    """CRUD operations for Strategy model."""
    
    def get_by_name(self, db: Session, *, name: str, user_id: int) -> Optional[Strategy]:
        ""Get a strategy by name for a specific user."""
        return (
            db.query(Strategy)
            .filter(Strategy.name == name, Strategy.user_id == user_id)
            .first()
        )
    
    def get_multi_by_owner(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Strategy]:
        ""Get multiple strategies for a specific user."""
        return (
            db.query(Strategy)
            .filter(Strategy.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_by_account(
        self, db: Session, *, account_id: int, skip: int = 0, limit: int = 100
    ) -> List[Strategy]:
        ""Get multiple strategies for a specific account."""
        return (
            db.query(Strategy)
            .filter(Strategy.account_id == account_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def create_with_owner(
        self, db: Session, *, obj_in: StrategyCreate, user_id: int
    ) -> Strategy:
        ""Create a new strategy for a user."""
        db_obj = Strategy(
            user_id=user_id,
            account_id=obj_in.account_id,
            name=obj_in.name,
            description=obj_in.description,
            strategy_type=obj_in.strategy_type,
            config=obj_in.config,
            is_active=obj_in.is_active if hasattr(obj_in, 'is_active') else True,
            is_system=obj_in.is_system if hasattr(obj_in, 'is_system') else False,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update_performance_metrics(
        self, db: Session, *, db_obj: Strategy
    ) -> Strategy:
        ""Update the performance metrics for a strategy."""
        from sqlalchemy import func
        from ..models.bet import Bet, BetStatus
        
        # Get all settled bets for this strategy
        settled_bets = (
            db.query(Bet)
            .filter(
                Bet.strategy_id == db_obj.id,
                Bet.status == BetStatus.SETTLED.value
            )
            .all()
        )
        
        # Calculate metrics
        total_bets = len(settled_bets)
        winning_bets = len([b for b in settled_bets if b.profit_loss and b.profit_loss > 0])
        losing_bets = len([b for b in settled_bets if b.profit_loss and b.profit_loss <= 0])
        
        total_stake = sum(b.size for b in settled_bets if b.size)
        total_payout = sum(b.profit_loss + b.size for b in settled_bets if b.profit_loss is not None and b.size)
        total_profit = sum(b.profit_loss for b in settled_bets if b.profit_loss is not None)
        
        win_rate = (winning_bets / total_bets * 100) if total_bets > 0 else 0
        roi = (total_profit / total_stake * 100) if total_stake > 0 else 0
        
        # Update the strategy
        db_obj.total_bets = total_bets
        db_obj.winning_bets = winning_bets
        db_obj.losing_bets = losing_bets
        db_obj.total_stake = total_stake
        db_obj.total_payout = total_payout
        db_obj.total_profit = total_profit
        db_obj.win_rate = win_rate
        db_obj.roi = roi
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        return db_obj

# Create a singleton instance
strategy = CRUDStrategy(Strategy)
