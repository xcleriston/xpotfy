from typing import Any, Dict, List, Optional, Union

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from ..crud.base import CRUDBase
from ..models.account import Account
from ..schemas.account import AccountCreate, AccountUpdate

class CRUDAccount(CRUDBase[Account, AccountCreate, AccountUpdate]):
    """CRUD operations for Account model."""
    
    def get_by_name(self, db: Session, *, name: str, user_id: int) -> Optional[Account]:
        ""Get an account by name for a specific user."""
        return (
            db.query(Account)
            .filter(Account.account_name == name, Account.user_id == user_id)
            .first()
        )
    
    def get_multi_by_owner(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Account]:
        ""Get multiple accounts for a specific user."""
        return (
            db.query(Account)
            .filter(Account.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def create(self, db: Session, *, obj_in: AccountCreate, user_id: int) -> Account:
        ""Create a new account for a user."""
        db_obj = Account(
            user_id=user_id,
            account_name=obj_in.account_name,
            account_type=obj_in.account_type,
            api_key=obj_in.api_key,
            username=obj_in.username,
            password=obj_in.password,
            is_active=obj_in.is_active if hasattr(obj_in, 'is_active') else True,
            balance=obj_in.balance if hasattr(obj_in, 'balance') else 0.0,
            currency=obj_in.currency if hasattr(obj_in, 'currency') else "USD",
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update_balance(
        self, db: Session, *, db_obj: Account, amount: float
    ) -> Account:
        ""Update the account balance by a specified amount."""
        db_obj.balance += amount
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def set_balance(
        self, db: Session, *, db_obj: Account, balance: float
    ) -> Account:
        ""Set the account balance to a specific amount."""
        db_obj.balance = balance
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

# Create a singleton instance
account = CRUDAccount(Account)
