from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union, Generator

from fastapi.encoders import jsonable_encoder
from sqlalchemy import or_, func, and_
from sqlalchemy.orm import Session, joinedload

from ..crud.base import CRUDBase
from ..models.runner import Runner, RunnerStatus, RunnerOdds
from ..models.market import Market
from ..models.event import Event
from ..schemas.runner import RunnerCreate, RunnerUpdate, RunnerOddsCreate, RunnerOddsUpdate

class CRUDRunner(CRUDBase[Runner, RunnerCreate, RunnerUpdate]):
    """CRUD operations for Runner model."""
    
    def get_by_betfair_id(self, db: Session, *, betfair_id: int) -> Optional[Runner]:
        """Get a runner by its Betfair ID."""
        return db.query(Runner).filter(Runner.betfair_id == betfair_id).first()
    
    def get_multi_by_market(
        self, db: Session, *, market_id: str, skip: int = 0, limit: int = 100
    ) -> List[Runner]:
        """Get multiple runners for a specific market."""
        return (
            db.query(Runner)
            .filter(Runner.market_id == market_id)
            .order_by(Runner.sort_priority.asc(), Runner.name.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_by_status(
        self, db: Session, *, status: RunnerStatus, skip: int = 0, limit: int = 100
    ) -> List[Runner]:
        """Get multiple runners with a specific status."""
        return (
            db.query(Runner)
            .filter(Runner.status == status)
            .order_by(Runner.name.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def search(
        self, db: Session, *, query: str, skip: int = 0, limit: int = 100
    ) -> List[Runner]:
        """Search runners by name or market name."""
        search = f"%{query}%"
        return (
            db.query(Runner)
            .join(Market, Runner.market_id == Market.id)
            .filter(
                or_(
                    Runner.name.ilike(search),
                    Market.name.ilike(search)
                )
            )
            .order_by(Market.market_time.desc(), Runner.sort_priority.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def update_or_create(
        self, db: Session, *, obj_in: RunnerCreate, betfair_id: int, market_id: str
    ) -> Runner:
        """Update an existing runner or create a new one if it doesn't exist."""
        db_obj = self.get_by_betfair_id(db, betfair_id=betfair_id)
        
        if db_obj:
            # Update existing runner
            return self.update(db, db_obj=db_obj, obj_in=obj_in)
        else:
            # Create new runner
            obj_in_data = jsonable_encoder(obj_in)
            db_obj = Runner(**obj_in_data, betfair_id=betfair_id, market_id=market_id)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
    
    def update_status(
        self, db: Session, *, db_obj: Runner, status: RunnerStatus
    ) -> Runner:
        """Update the status of a runner."""
        db_obj.status = status
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update_odds(
        self, db: Session, *, db_obj: Runner, odds: float, total_matched: float = None
    ) -> Runner:
        """Update the odds and total matched for a runner."""
        db_obj.last_price_traded = odds
        if total_matched is not None:
            db_obj.total_matched = total_matched
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def record_odds(
        self, db: Session, *, runner_id: int, odds: float, total_matched: float = None
    ) -> RunnerOdds:
        """Record the current odds for a runner."""
        from ..crud import runner_odds
        
        odds_data = RunnerOddsCreate(
            runner_id=runner_id,
            odds=odds,
            total_matched=total_matched,
            timestamp=datetime.utcnow()
        )
        
        return runner_odds.create(db, obj_in=odds_data)
    
    def get_odds_history(
        self, db: Session, *, runner_id: int, hours: int = 24, limit: int = 1000
    ) -> List[RunnerOdds]:
        """Get the odds history for a runner."""
        from ..crud import runner_odds
        
        since = datetime.utcnow() - timedelta(hours=hours)
        
        return (
            db.query(RunnerOdds)
            .filter(
                RunnerOdds.runner_id == runner_id,
                RunnerOdds.timestamp >= since
            )
            .order_by(RunnerOdds.timestamp.asc())
            .limit(limit)
            .all()
        )
    
    def get_market_odds(
        self, db: Session, *, market_id: str, timestamp: datetime = None
    ) -> List[Tuple[Runner, float]]:
        """
        Get the latest odds for all runners in a market.
        
        Args:
            db: Database session
            market_id: ID of the market
            timestamp: Optional timestamp to get odds as of that time
            
        Returns:
            List of tuples containing (Runner, odds) for each runner in the market
        """
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        # Get the latest odds for each runner before the given timestamp
        subquery = (
            db.query(
                RunnerOdds.runner_id,
                func.max(RunnerOdds.timestamp).label('max_timestamp')
            )
            .join(Runner, Runner.id == RunnerOdds.runner_id)
            .filter(
                Runner.market_id == market_id,
                RunnerOdds.timestamp <= timestamp
            )
            .group_by(RunnerOdds.runner_id)
            .subquery()
        )
        
        # Get the actual odds data
        results = (
            db.query(Runner, RunnerOdds.odds)
            .join(
                RunnerOdds,
                and_(
                    Runner.id == RunnerOdds.runner_id,
                    RunnerOdds.timestamp == subquery.c.max_timestamp
                )
            )
            .join(
                subquery,
                Runner.id == subquery.c.runner_id
            )
            .filter(Runner.market_id == market_id)
            .all()
        )
        
        return results

# Create a singleton instance
runner = CRUDRunner(Runner)

class CRUDRunnerOdds(CRUDBase[RunnerOdds, RunnerOddsCreate, RunnerOddsUpdate]):
    """CRUD operations for RunnerOdds model."""
    
    def get_multi_by_runner(
        self, db: Session, *, runner_id: int, skip: int = 0, limit: int = 1000
    ) -> List[RunnerOdds]:
        """
        Get multiple odds records for a specific runner.
        
        Args:
            db: Database session
            runner_id: ID of the runner
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return
            
        Returns:
            List of RunnerOdds objects
        """
        return (
            db.query(RunnerOdds)
            .filter(RunnerOdds.runner_id == runner_id)
            .order_by(RunnerOdds.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_latest_by_runner(
        self, db: Session, *, runner_id: int
    ) -> Optional[RunnerOdds]:
        """
        Get the latest odds record for a specific runner.
        
        Args:
            db: Database session
            runner_id: ID of the runner
            
        Returns:
            Latest RunnerOdds object or None if no records exist
        """
        return (
            db.query(RunnerOdds)
            .filter(RunnerOdds.runner_id == runner_id)
            .order_by(RunnerOdds.timestamp.desc())
            .first()
        )
    
    def get_odds_history(
        self, 
        db: Session, 
        *, 
        runner_id: int, 
        start_time: datetime, 
        end_time: datetime = None
    ) -> List[RunnerOdds]:
        """
        Get odds history for a runner within a time range.
        
        Args:
            db: Database session
            runner_id: ID of the runner
            start_time: Start of the time range
            end_time: End of the time range (defaults to now if None)
            
        Returns:
            List of RunnerOdds objects within the specified time range
        """
        query = db.query(RunnerOdds).filter(
            RunnerOdds.runner_id == runner_id,
            RunnerOdds.timestamp >= start_time
        )
        
        if end_time:
            query = query.filter(RunnerOdds.timestamp <= end_time)
        
        return query.order_by(RunnerOdds.timestamp.asc()).all()

# Create a singleton instance
runner_odds = CRUDRunnerOdds(RunnerOdds)
