from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from ..crud.base import CRUDBase
from ..models.bet import Bet, BetStatus, BetSide, BetPersistenceType, BetOrderType
from ..schemas.bet import BetCreate, BetUpdate

class CRUDBet(CRUDBase[Bet, BetCreate, BetUpdate]):
    """CRUD operations for Bet model."""
    
    def get_multi_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Bet]:
        ""Get multiple bets for a specific user."""
        return (
            db.query(Bet)
            .filter(Bet.user_id == user_id)
            .order_by(Bet.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_by_account(
        self, db: Session, *, account_id: int, skip: int = 0, limit: int = 100
    ) -> List[Bet]:
        ""Get multiple bets for a specific account."""
        return (
            db.query(Bet)
            .filter(Bet.account_id == account_id)
            .order_by(Bet.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_by_strategy(
        self, db: Session, *, strategy_id: int, skip: int = 0, limit: int = 100
    ) -> List[Bet]:
        ""Get multiple bets for a specific strategy."""
        return (
            db.query(Bet)
            .filter(Bet.strategy_id == strategy_id)
            .order_by(Bet.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_by_market(
        self, db: Session, *, market_id: str, skip: int = 0, limit: int = 100
    ) -> List[Bet]:
        ""Get multiple bets for a specific market."""
        return (
            db.query(Bet)
            .filter(Bet.market_id == market_id)
            .order_by(Bet.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_by_runner(
        self, db: Session, *, runner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Bet]:
        ""Get multiple bets for a specific runner."""
        return (
            db.query(Bet)
            .filter(Bet.runner_id == runner_id)
            .order_by(Bet.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_by_status(
        self, db: Session, *, status: BetStatus, skip: int = 0, limit: int = 100
    ) -> List[Bet]:
        ""Get multiple bets with a specific status."""
        return (
            db.query(Bet)
            .filter(Bet.status == status)
            .order_by(Bet.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def create_with_user(
        self, db: Session, *, obj_in: BetCreate, user_id: int
    ) -> Bet:
        ""Create a new bet for a user."""
        db_obj = Bet(
            user_id=user_id,
            account_id=obj_in.account_id,
            strategy_id=obj_in.strategy_id,
            market_id=obj_in.market_id,
            runner_id=obj_in.runner_id,
            bet_type=obj_in.bet_type,
            status=obj_in.status if hasattr(obj_in, 'status') else BetStatus.PENDING,
            price=obj_in.price,
            size=obj_in.size,
            side=obj_in.side if hasattr(obj_in, 'side') else BetSide.BACK,
            persistence_type=obj_in.persistence_type if hasattr(obj_in, 'persistence_type') else BetPersistenceType.LAPSE,
            order_type=obj_in.order_type if hasattr(obj_in, 'order_type') else BetOrderType.LIMIT,
            reference_order=obj_in.reference_order if hasattr(obj_in, 'reference_order') else None,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update_status(
        self, db: Session, *, db_obj: Bet, status: BetStatus, profit_loss: float = None
    ) -> Bet:
        ""Update the status of a bet and optionally set profit/loss."""
        db_obj.status = status
        
        if status == BetStatus.SETTLED and profit_loss is not None:
            db_obj.profit_loss = profit_loss
            db_obj.settled_date = datetime.utcnow()
            
            # Update the associated strategy's performance metrics
            if db_obj.strategy_id:
                from ..crud import strategy
                strategy_obj = strategy.get(db, id=db_obj.strategy_id)
                if strategy_obj:
                    strategy.update_performance_metrics(db, db_obj=strategy_obj)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_total_stake(
        self, db: Session, *, user_id: Optional[int] = None, account_id: Optional[int] = None,
        strategy_id: Optional[int] = None, status: Optional[BetStatus] = None
    ) -> float:
        ""Get the total stake for matching bets."""
        query = db.query(Bet)
        
        if user_id is not None:
            query = query.filter(Bet.user_id == user_id)
        if account_id is not None:
            query = query.filter(Bet.account_id == account_id)
        if strategy_id is not None:
            query = query.filter(Bet.strategy_id == strategy_id)
        if status is not None:
            query = query.filter(Bet.status == status)
        
        total = query.with_entities(func.sum(Bet.size)).scalar()
        return float(total) if total is not None else 0.0
    
    def get_total_profit(
        self, db: Session, *, user_id: Optional[int] = None, account_id: Optional[int] = None,
        strategy_id: Optional[int] = None, status: BetStatus = BetStatus.SETTLED
    ) -> float:
        ""Get the total profit/loss for matching settled bets."""
        query = db.query(Bet).filter(Bet.status == status)
        
        if user_id is not None:
            query = query.filter(Bet.user_id == user_id)
        if account_id is not None:
            query = query.filter(Bet.account_id == account_id)
        if strategy_id is not None:
            query = query.filter(Bet.strategy_id == strategy_id)
        
        total = query.with_entities(func.sum(Bet.profit_loss)).scalar()
        return float(total) if total is not None else 0.0

# Create a singleton instance
bet = CRUDBet(Bet)
