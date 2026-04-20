from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from fastapi.encoders import jsonable_encoder
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..crud.base import CRUDBase
from ..models.market import Market, MarketType, MarketStatus
from ..schemas.market import MarketCreate, MarketUpdate

class CRUDMarket(CRUDBase[Market, MarketCreate, MarketUpdate]):
    """CRUD operations for Market model."""
    
    def get_by_betfair_id(self, db: Session, *, betfair_id: str) -> Optional[Market]:
        ""Get a market by its Betfair ID."""
        return db.query(Market).filter(Market.betfair_id == betfair_id).first()
    
    def get_multi_by_event(
        self, db: Session, *, event_id: str, skip: int = 0, limit: int = 100
    ) -> List[Market]:
        ""Get multiple markets for a specific event."""
        return (
            db.query(Market)
            .filter(Market.event_id == event_id)
            .order_by(Market.market_time.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_by_type(
        self, db: Session, *, market_type: MarketType, skip: int = 0, limit: int = 100
    ) -> List[Market]:
        ""Get multiple markets of a specific type."""
        return (
            db.query(Market)
            .filter(Market.market_type == market_type)
            .order_by(Market.market_time.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_by_status(
        self, db: Session, *, status: MarketStatus, skip: int = 0, limit: int = 100
    ) -> List[Market]:
        ""Get multiple markets with a specific status."""
        return (
            db.query(Market)
            .filter(Market.status == status)
            .order_by(Market.market_time.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_upcoming_markets(
        self, db: Session, *, skip: int = 0, limit: int = 100, hours_ahead: int = 24
    ) -> List[Market]:
        ""Get upcoming markets within the next N hours."""
        now = datetime.utcnow()
        future = datetime.utcnow() + datetime.timedelta(hours=hours_ahead)
        
        return (
            db.query(Market)
            .filter(
                Market.market_time >= now,
                Market.market_time <= future,
                Market.status.in_([MarketStatus.OPEN, MarketStatus.SUSPENDED])
            )
            .order_by(Market.market_time.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def search(
        self, db: Session, *, query: str, skip: int = 0, limit: int = 100
    ) -> List[Market]:
        ""Search markets by name or event name."""
        search = f"%{query}%"
        return (
            db.query(Market)
            .join(Event, Market.event_id == Event.id)
            .filter(
                or_(
                    Market.name.ilike(search),
                    Event.name.ilike(search)
                )
            )
            .order_by(Market.market_time.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def update_or_create(
        self, db: Session, *, obj_in: MarketCreate, betfair_id: str
    ) -> Market:
        ""Update an existing market or create a new one if it doesn't exist."""
        db_obj = self.get_by_betfair_id(db, betfair_id=betfair_id)
        
        if db_obj:
            # Update existing market
            return self.update(db, db_obj=db_obj, obj_in=obj_in)
        else:
            # Create new market
            obj_in_data = jsonable_encoder(obj_in)
            db_obj = Market(**obj_in_data, betfair_id=betfair_id)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
    
    def update_status(
        self, db: Session, *, db_obj: Market, status: MarketStatus
    ) -> Market:
        ""Update the status of a market."""
        db_obj.status = status
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update_total_matched(
        self, db: Session, *, db_obj: Market, total_matched: float
    ) -> Market:
        ""Update the total matched amount for a market."""
        db_obj.total_matched = total_matched
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

# Create a singleton instance
market = CRUDMarket(Market)
