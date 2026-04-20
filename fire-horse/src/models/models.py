from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker, Session
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# SQLAlchemy setup
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fire_horse.db")
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency to get DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# SQLAlchemy Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    strategies = relationship("Strategy", back_populates="owner")
    bets = relationship("Bet", back_populates="user")
    accounts = relationship("Account", back_populates="user")

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    account_name = Column(String, index=True)
    account_type = Column(String)  # e.g., 'betfair', 'bet365'
    api_key = Column(String, nullable=True)
    api_secret = Column(String, nullable=True)
    username = Column(String, nullable=True)
    password = Column(String, nullable=True)  # Should be encrypted in production
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="accounts")
    strategies = relationship("Strategy", back_populates="account")
    bets = relationship("Bet", back_populates="account")

class Strategy(Base):
    __tablename__ = "strategies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    config = Column(JSON)  # JSON configuration for the strategy
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    account_id = Column(Integer, ForeignKey("accounts.id"))
    
    # Relationships
    owner = relationship("User", back_populates="strategies")
    account = relationship("Account", back_populates="strategies")
    bets = relationship("Bet", back_populates="strategy")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(String, primary_key=True, index=True)  # Betfair event ID
    name = Column(String, index=True)
    country_code = Column(String)
    timezone = Column(String)
    venue = Column(String, nullable=True)
    open_date = Column(DateTime)
    event_type_id = Column(String)  # e.g., '7' for horse racing
    market_count = Column(Integer, default=0)
    status = Column(String)  # e.g., 'OPEN', 'CLOSED', 'SUSPENDED'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    markets = relationship("Market", back_populates="event")

class Market(Base):
    __tablename__ = "markets"
    
    id = Column(String, primary_key=True, index=True)  # Betfair market ID
    event_id = Column(String, ForeignKey("events.id"))
    name = Column(String)
    market_type = Column(String)  # e.g., 'WIN', 'PLACE', 'EACH_WAY'
    market_time = Column(DateTime)
    total_matched = Column(Float, default=0.0)
    status = Column(String)  # e.g., 'OPEN', 'CLOSED', 'SUSPENDED'
    betting_type = Column(String)  # e.g., 'ODDS'
    number_of_winners = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    event = relationship("Event", back_populates="markets")
    runners = relationship("Runner", back_populates="market")
    bets = relationship("Bet", back_populates="market")

class Runner(Base):
    __tablename__ = "runners"
    
    id = Column(Integer, primary_key=True, index=True)  # Betfair selection ID
    market_id = Column(String, ForeignKey("markets.id"))
    name = Column(String, index=True)
    handicap = Column(Float, default=0.0)
    sort_priority = Column(Integer, default=0)
    status = Column(String)  # e.g., 'ACTIVE', 'REMOVED', 'WINNER', 'LOSER', 'PLACED'
    last_price_traded = Column(Float, nullable=True)
    total_matched = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    market = relationship("Market", back_populates="runners")
    odds = relationship("RunnerOdds", back_populates="runner", order_by="desc(RunnerOdds.timestamp)")
    bets = relationship("Bet", back_populates="runner")

class RunnerOdds(Base):
    __tablename__ = "runner_odds"
    
    id = Column(Integer, primary_key=True, index=True)
    runner_id = Column(Integer, ForeignKey("runners.id"))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    last_price_traded = Column(Float, nullable=True)
    total_matched = Column(Float, default=0.0)
    available_to_back = Column(JSON)  # List of price/size objects
    available_to_lay = Column(JSON)   # List of price/size objects
    
    # Relationships
    runner = relationship("Runner", back_populates="odds")

class Bet(Base):
    __tablename__ = "bets"
    
    id = Column(String, primary_key=True, index=True)  # Betfair bet ID or system-generated
    user_id = Column(Integer, ForeignKey("users.id"))
    account_id = Column(Integer, ForeignKey("accounts.id"))
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True)
    market_id = Column(String, ForeignKey("markets.id"))
    runner_id = Column(Integer, ForeignKey("runners.id"))
    bet_type = Column(String)  # 'BACK' or 'LAY'
    status = Column(String)  # 'PENDING', 'EXECUTABLE', 'EXECUTION_COMPLETE', 'EXPIRED', 'CANCELLED', 'LAPSED', 'SETTLED', 'VOIDED'
    price = Column(Float)
    size = Column(Float)  # Stake amount
    bsp_liability = Column(Float, nullable=True)
    placed_date = Column(DateTime, default=datetime.utcnow)
    matched_date = Column(DateTime, nullable=True)
    settled_date = Column(DateTime, nullable=True)
    profit_loss = Column(Float, nullable=True)  # Positive for profit, negative for loss
    side = Column(String, default='BACK')  # 'BACK' or 'LAY'
    persistence_type = Column(String, default='LAPSE')  # 'LAPSE', 'PERSIST', 'MARKET_ON_CLOSE'
    order_type = Column(String, default='LIMIT')  # 'LIMIT', 'LIMIT_ON_CLOSE', 'MARKET_ON_CLOSE'
    reference_order = Column(String, nullable=True)  # For linking related bets
    
    # Relationships
    user = relationship("User", back_populates="bets")
    account = relationship("Account", back_populates="bets")
    strategy = relationship("Strategy", back_populates="bets")
    market = relationship("Market", back_populates="bets")
    runner = relationship("Runner", back_populates="bets")

# Pydantic Models (for request/response validation)
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class AccountBase(BaseModel):
    account_name: str
    account_type: str
    api_key: Optional[str] = None
    username: Optional[str] = None
    is_active: bool = True

class AccountCreate(AccountBase):
    password: Optional[str] = None

class AccountInDB(AccountBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class StrategyBase(BaseModel):
    name: str
    description: Optional[str] = None
    config: dict
    is_active: bool = True
    account_id: int

class StrategyCreate(StrategyBase):
    pass

class StrategyInDB(StrategyBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class BetBase(BaseModel):
    market_id: str
    runner_id: int
    bet_type: str
    price: float
    size: float
    side: str = 'BACK'
    persistence_type: str = 'LAPSE'
    order_type: str = 'LIMIT'
    reference_order: Optional[str] = None

class BetCreate(BetBase):
    strategy_id: Optional[int] = None

class BetInDB(BetBase):
    id: str
    user_id: int
    account_id: int
    strategy_id: Optional[int]
    status: str
    placed_date: datetime
    matched_date: Optional[datetime] = None
    settled_date: Optional[datetime] = None
    profit_loss: Optional[float] = None
    
    class Config:
        orm_mode = True

# Create tables
def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    print("Creating database tables...")
    init_db()
    print("Database tables created successfully!")
