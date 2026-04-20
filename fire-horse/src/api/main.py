from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uvicorn
import os
from pathlib import Path

# Adiciona o diretório raiz ao path
import sys
sys.path.append(str(Path(__file__).parent.parent.parent))

# Importações dos modelos e schemas
from src.db.base import SessionLocal, engine
from src.models.models import User, Account, Strategy, Event, Market, Runner, Bet
from src.models.models import Base

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

# Rotas para Usuários
@app.get("/users/", response_model=List[dict])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return [{"id": u.id, "username": u.username, "email": u.email} for u in users]

@app.get("/users/{user_id}", response_model=dict)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "username": user.username, "email": user.email}

# Rotas para Eventos
@app.get("/events/", response_model=List[dict])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    events = db.query(Event).offset(skip).limit(limit).all()
    return [{
        "id": e.id,
        "name": e.name,
        "venue": e.venue,
        "open_date": e.open_date.isoformat() if e.open_date else None,
        "status": e.status
    } for e in events]

# Rotas para Mercados
@app.get("/markets/", response_model=List[dict])
def read_markets(
    event_id: Optional[str] = None, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = db.query(Market)
    if event_id:
        query = query.filter(Market.event_id == event_id)
    markets = query.offset(skip).limit(limit).all()
    
    return [{
        "id": m.id,
        "name": m.name,
        "event_id": m.event_id,
        "market_type": m.market_type,
        "status": m.status,
        "market_time": m.market_time.isoformat() if m.market_time else None
    } for m in markets]

# Rotas para Corredores
@app.get("/runners/", response_model=List[dict])
def read_runners(
    market_id: str, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    runners = db.query(Runner).filter(
        Runner.market_id == market_id
    ).offset(skip).limit(limit).all()
    
    return [{
        "id": r.id,
        "name": r.name,
        "last_price_traded": r.last_price_traded,
        "status": r.status
    } for r in runners]

# Rotas para Estratégias
@app.get("/strategies/", response_model=List[dict])
def read_strategies(
    user_id: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = db.query(Strategy)
    if user_id:
        query = query.filter(Strategy.user_id == user_id)
    strategies = query.offset(skip).limit(limit).all()
    
    return [{
        "id": s.id,
        "name": s.name,
        "description": s.description,
        "is_active": s.is_active,
        "user_id": s.user_id,
        "account_id": s.account_id
    } for s in strategies]

# Rotas para Contas
@app.get("/accounts/", response_model=List[dict])
def read_accounts(
    user_id: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = db.query(Account)
    if user_id:
        query = query.filter(Account.user_id == user_id)
    accounts = query.offset(skip).limit(limit).all()
    
    return [{
        "id": a.id,
        "account_name": a.account_name,
        "account_type": a.account_type,
        "is_active": a.is_active,
        "user_id": a.user_id
    } for a in accounts]

# Rota raiz
@app.get("/")
async def root():
    return {
        "message": "Bem-vindo à API do Fire Horse",
        "documentation": "/docs",
        "version": "1.0.0"
    }

# Inicialização do servidor
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
