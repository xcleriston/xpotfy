""CRUD operations for the application."""

from .base import CRUDBase
from .crud_user import user as user_crud
from .crud_account import account as account_crud
from .crud_strategy import strategy as strategy_crud
from .crud_bet import bet as bet_crud
from .crud_event import event as event_crud
from .crud_market import market as market_crud
from .crud_runner import runner as runner_crud, runner_odds as runner_odds_crud

# Re-export all CRUD operations for easier imports
__all__ = [
    "CRUDBase",
    "user_crud",
    "account_crud",
    "strategy_crud",
    "bet_crud",
    "event_crud",
    "market_crud",
    "runner_crud",
    "runner_odds_crud",
]
