from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    auth, users, bets, markets, strategies, accounts, events, runners
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(bets.router, prefix="/bets", tags=["bets"])
api_router.include_router(markets.router, prefix="/markets", tags=["markets"])
api_router.include_router(strategies.router, prefix="/strategies", tags=["strategies"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(runners.router, prefix="/runners", tags=["runners"])
