from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from fastapi.encoders import jsonable_encoder
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..crud.base import CRUDBase
from ..models.event import Event, EventType, EventStatus
from ..schemas.event import EventCreate, EventUpdate

class CRUDEvent(CRUDBase[Event, EventCreate, EventUpdate]):
    """CRUD operations for Event model."""
    
    def get_by_betfair_id(self, db: Session, *, betfair_id: str) -> Optional[Event]:
        ""Get an event by its Betfair ID."""
        return db.query(Event).filter(Event.betfair_id == betfair_id).first()
    
    def get_multi_by_type(
        self, db: Session, *, event_type: EventType, skip: int = 0, limit: int = 100
    ) -> List[Event]:
        ""Get multiple events of a specific type."""
        return (
            db.query(Event)
            .filter(Event.event_type == event_type)
            .order_by(Event.open_date.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_by_status(
        self, db: Session, *, status: EventStatus, skip: int = 0, limit: int = 100
    ) -> List[Event]:
        ""Get multiple events with a specific status."""
        return (
            db.query(Event)
            .filter(Event.status == status)
            .order_by(Event.open_date.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_upcoming_events(
        self, db: Session, *, skip: int = 0, limit: int = 100, hours_ahead: int = 24
    ) -> List[Event]:
        ""Get upcoming events within the next N hours."""
        now = datetime.utcnow()
        future = datetime.utcnow() + datetime.timedelta(hours=hours_ahead)
        
        return (
            db.query(Event)
            .filter(
                Event.open_date >= now,
                Event.open_date <= future,
                Event.status.in_([EventStatus.ACTIVE, EventStatus.INACTIVE])
            )
            .order_by(Event.open_date.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def search(
        self, db: Session, *, query: str, skip: int = 0, limit: int = 100
    ) -> List[Event]:
        ""Search events by name, venue, or competition."""
        search = f"%{query}%"
        return (
            db.query(Event)
            .filter(
                or_(
                    Event.name.ilike(search),
                    Event.venue.ilike(search),
                    Event.competition.ilike(search)
                )
            )
            .order_by(Event.open_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def update_or_create(
        self, db: Session, *, obj_in: EventCreate, betfair_id: str
    ) -> Event:
        ""Update an existing event or create a new one if it doesn't exist."""
        db_obj = self.get_by_betfair_id(db, betfair_id=betfair_id)
        
        if db_obj:
            # Update existing event
            return self.update(db, db_obj=db_obj, obj_in=obj_in)
        else:
            # Create new event
            obj_in_data = jsonable_encoder(obj_in)
            db_obj = Event(**obj_in_data, betfair_id=betfair_id)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj

# Create a singleton instance
event = CRUDEvent(Event)
