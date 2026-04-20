from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uvicorn
import sys
from pathlib import Path

# Adiciona o diretório raiz ao path
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

# Importações dos modelos e schemas
from src.db.base import SessionLocal, engine, Base
from src.models.models import User, Account, Strategy, Event, Market, Runner, Bet, RunnerOdds

# Cria as tabelas no banco de dados
Base.metadata.create_all(bind=engine)

# Inicializa o aplicativo FastAPI
app = FastAPI(
    title="Fire Horse API",
    description="API para o sistema de apostas Fire Horse",
    version="1.0.0"
)

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, substitua por origens específicas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependência para obter a sessão do banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Modelos Pydantic para validação de entrada/saída
from pydantic import BaseModel
from typing import Optional as Opt

class UserBase(BaseModel):
    username: str
    email: Opt[str] = None
    is_active: Opt[bool] = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Rotas para Usuários
@app.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=List[UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@app.get("/users/{user_id}", response_model=UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Rotas para Eventos
class EventBase(BaseModel):
    name: str
    country_code: str
    timezone: str
    venue: Opt[str] = None
    open_date: datetime
    event_type_id: str
    status: str

class EventResponse(EventBase):
    id: str
    market_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@app.post("/events/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(event: EventBase, db: Session = Depends(get_db)):
    db_event = Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.get("/events/", response_model=List[EventResponse])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    events = db.query(Event).offset(skip).limit(limit).all()
    return events

# Rota raiz
@app.get("/")
async def root():
    return {
        "message": "Bem-vindo à API do Fire Horse",
        "documentation": "/docs",
        "version": "1.0.0"
    }
