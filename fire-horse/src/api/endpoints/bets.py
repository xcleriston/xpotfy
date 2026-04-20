from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime

from ... import models, schemas, crud
from ...db.session import get_db
from ...core.security import get_current_active_user
from ...services.betfair_service import BetfairService

router = APIRouter()

@router.get("/", response_model=List[schemas.Bet])
def read_bets(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve bets for the current user.
    """
    bets = crud.bet.get_multi_by_owner(
        db, owner_id=current_user.id, skip=skip, limit=limit
    )
    return bets

@router.post("/place", response_model=schemas.Bet)
def place_bet(
    *,
    db: Session = Depends(get_db),
    bet_in: schemas.BetCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Place a new bet.
    """
    # Get the user's account
    account = crud.account.get(db, id=bet_in.account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=404,
            detail="Account not found or access denied"
        )
    
    # Get the strategy if specified
    strategy = None
    if bet_in.strategy_id:
        strategy = crud.strategy.get(db, id=bet_in.strategy_id)
        if not strategy or strategy.user_id != current_user.id:
            raise HTTPException(
                status_code=404,
                detail="Strategy not found or access denied"
            )
    
    # Get the market and runner details
    market = crud.market.get(db, id=bet_in.market_id)
    if not market:
        raise HTTPException(
            status_code=404,
            detail="Market not found"
        )
    
    runner = crud.runner.get(db, id=bet_in.runner_id)
    if not runner or runner.market_id != market.id:
        raise HTTPException(
            status_code=404,
            detail="Runner not found in the specified market"
        )
    
    # Initialize Betfair service
    betfair_service = BetfairService(
        app_key=account.api_key,
        username=account.username,
        password=account.password
    )
    
    try:
        # Place the bet via Betfair API
        instructions = [{
            'selectionId': str(runner.id),
            'handicap': runner.handicap,
            'side': bet_in.side.upper(),
            'orderType': bet_in.order_type.upper(),
            'limitOrder': {
                'size': float(bet_in.size),
                'price': float(bet_in.price),
                'persistenceType': bet_in.persistence_type.upper()
            }
        }]
        
        # Add customer reference if provided
        customer_ref = f"user_{current_user.id}_{int(datetime.utcnow().timestamp())}"
        
        # Place the order
        result = betfair_service.place_orders(
            market_id=market.id,
            instructions=instructions,
            customer_ref=customer_ref
        )
        
        if not result or 'instructionReports' not in result or not result['instructionReports']:
            raise HTTPException(
                status_code=400,
                detail="Failed to place bet: No response from Betfair"
            )
        
        # Check for errors in the response
        for report in result['instructionReports']:
            if report.get('status') != 'SUCCESS':
                error_code = report.get('errorCode', 'UNKNOWN_ERROR')
                error_message = report.get('instruction', {}).get('errorMessage', 'Unknown error')
                raise HTTPException(
                    status_code=400,
                    detail=f"Bet placement failed: {error_message} (Code: {error_code})"
                )
        
        # Extract bet details from the response
        bet_report = result['instructionReports'][0]
        bet_id = bet_report.get('betId')
        
        if not bet_id:
            raise HTTPException(
                status_code=400,
                detail="Failed to place bet: No bet ID in response"
            )
        
        # Create the bet record in our database
        bet_data = {
            'id': bet_id,
            'user_id': current_user.id,
            'account_id': account.id,
            'strategy_id': strategy.id if strategy else None,
            'market_id': market.id,
            'runner_id': runner.id,
            'bet_type': bet_in.side.upper(),
            'status': 'PENDING',  # Will be updated by the order status polling
            'price': bet_in.price,
            'size': bet_in.size,
            'side': bet_in.side.upper(),
            'persistence_type': bet_in.persistence_type.upper(),
            'order_type': bet_in.order_type.upper(),
            'reference_order': bet_in.reference_order
        }
        
        bet = crud.bet.create(db, obj_in=bet_data)
        
        return bet
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to place bet: {str(e)}"
        )

@router.get("/{bet_id}", response_model=schemas.Bet)
def read_bet(
    bet_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get a specific bet by ID.
    """
    bet = crud.bet.get(db, id=bet_id)
    if not bet:
        raise HTTPException(
            status_code=404,
            detail="Bet not found"
        )
    if bet.user_id != current_user.id and not crud.user.is_superuser(current_user):
        raise HTTPException(
            status_code=400,
            detail="Not enough permissions"
        )
    return bet

@router.get("/market/{market_id}", response_model=List[schemas.Bet])
def read_bets_for_market(
    market_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get all bets for a specific market.
    """
    bets = crud.bet.get_multi_by_market(
        db, market_id=market_id, user_id=current_user.id
    )
    return bets

@router.post("/cancel/{bet_id}", response_model=schemas.Bet)
def cancel_bet(
    *,
    db: Session = Depends(get_db),
    bet_id: str,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Cancel a bet.
    """
    bet = crud.bet.get(db, id=bet_id)
    if not bet:
        raise HTTPException(
            status_code=404,
            detail="Bet not found"
        )
    if bet.user_id != current_user.id and not crud.user.is_superuser(current_user):
        raise HTTPException(
            status_code=400,
            detail="Not enough permissions"
        )
    
    # Only allow cancellation of pending or executable bets
    if bet.status not in ['PENDING', 'EXECUTABLE']:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel bet with status: {bet.status}"
        )
    
    # Get the account
    account = crud.account.get(db, id=bet.account_id)
    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found"
        )
    
    # Initialize Betfair service
    betfair_service = BetfairService(
        app_key=account.api_key,
        username=account.username,
        password=account.password
    )
    
    try:
        # Cancel the bet via Betfair API
        instructions = [{
            'betId': bet_id,
            'sizeReduction': None  # Cancel the entire bet
        }]
        
        result = betfair_service.cancel_orders(
            market_id=bet.market_id,
            instructions=instructions
        )
        
        if not result or 'instructionReports' not in result or not result['instructionReports']:
            raise HTTPException(
                status_code=400,
                detail="Failed to cancel bet: No response from Betfair"
            )
        
        # Check for errors in the response
        for report in result['instructionReports']:
            if report.get('status') != 'SUCCESS':
                error_code = report.get('errorCode', 'UNKNOWN_ERROR')
                error_message = report.get('instruction', {}).get('errorMessage', 'Unknown error')
                raise HTTPException(
                    status_code=400,
                    detail=f"Bet cancellation failed: {error_message} (Code: {error_code})"
                )
        
        # Update the bet status in our database
        bet = crud.bet.update(
            db, 
            db_obj=bet, 
            obj_in={'status': 'CANCELLED'}
        )
        
        return bet
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to cancel bet: {str(e)}"
        )
