import os
import json
import requests
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from urllib.parse import urljoin
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BetfairAPIError(Exception):
    """Custom exception for Betfair API errors"""
    pass

class BetfairService:
    """Service to interact with Betfair API"""
    
    BASE_URL = "https://api.betfair.com/exchange/betting/rest/v1.0/"
    IDENTITY_URL = "https://identitysso.betfair.com/api/"
    
    def __init__(self, app_key: str = None, username: str = None, password: str = None):
        self.app_key = app_key or os.getenv("BETFAIR_APP_KEY")
        self.username = username or os.getenv("BETFAIR_USERNAME")
        self.password = password or os.getenv("BETFAIR_PASSWORD")
        self.session_token = None
        self.session_expiry = None
        
        if not all([self.app_key, self.username, self.password]):
            raise ValueError("Missing required Betfair API credentials")
    
    def _make_request(self, endpoint: str, params: dict = None, method: str = 'GET', data: dict = None) -> dict:
        """Generic method to make HTTP requests to Betfair API"""
        url = urljoin(self.BASE_URL, endpoint)
        headers = {
            'X-Application': self.app_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        if self.session_token:
            headers['X-Authentication'] = self.session_token
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=headers, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Betfair API request failed: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response body: {e.response.text}")
            raise BetfairAPIError(f"Betfair API request failed: {str(e)}")
    
    def login(self) -> bool:
        """Authenticate with Betfair and get session token"""
        url = urljoin(self.IDENTITY_URL, 'certlogin')
        data = f'username={self.username}&password={self.password}'
        headers = {
            'X-Application': self.app_key,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        try:
            response = requests.post(url, data=data, headers=headers, cert=os.getenv('BETFAIR_CERTS_PATH'))
            response.raise_for_status()
            
            login_response = response.json()
            
            if login_response.get('status') == 'SUCCESS':
                self.session_token = login_response.get('sessionToken')
                self.session_expiry = datetime.now() + timedelta(hours=24)  # Session typically lasts 24 hours
                logger.info("Successfully authenticated with Betfair API")
                return True
            else:
                error_message = login_response.get('error', 'UNKNOWN_ERROR')
                logger.error(f"Betfair login failed: {error_message}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Betfair login request failed: {str(e)}")
            raise BetfairAPIError(f"Login failed: {str(e)}")
    
    def is_authenticated(self) -> bool:
        """Check if the current session is still valid"""
        if not self.session_token or not self.session_expiry:
            return False
        return datetime.now() < self.session_expiry
    
    def ensure_authenticated(self):
        """Ensure we have a valid session token"""
        if not self.is_authenticated():
            if not self.login():
                raise BetfairAPIError("Failed to authenticate with Betfair API")
    
    def list_events(self, event_type_ids: List[str] = None, market_filter: dict = None) -> List[dict]:
        """List horse racing events"""
        self.ensure_authenticated()
        
        if not event_type_ids:
            event_type_ids = ["7"]  # Default to Horse Racing
            
        if not market_filter:
            market_filter = {
                'eventTypeIds': event_type_ids,
                'marketCountries': ['GB', 'IE', 'AU', 'US'],
                'marketTypeCodes': ['WIN'],
                'marketStartTime': {
                    'from': (datetime.utcnow().isoformat() + 'Z'),
                    'to': (datetime.utcnow() + timedelta(days=1)).isoformat() + 'Z'
                }
            }
        
        data = {
            'filter': market_filter,
            'maxResults': 1000,
            'marketProjection': ['EVENT', 'EVENT_TYPE', 'MARKET_START_TIME']
        }
        
        response = self._make_request('listEvents/', method='POST', data=data)
        return response.get('result', [])
    
    def list_market_catalogue(
        self, 
        event_ids: List[str] = None,
        market_projection: List[str] = None,
        max_results: int = 1000
    ) -> List[dict]:
        """Get market catalogue for specific events"""
        self.ensure_authenticated()
        
        if market_projection is None:
            market_projection = [
                'COMPETITION',
                'EVENT',
                'EVENT_TYPE',
                'MARKET_START_TIME',
                'MARKET_DESCRIPTION',
                'RUNNER_DESCRIPTION',
                'RUNNER_METADATA'
            ]
        
        data = {
            'filter': {},
            'marketProjection': market_projection,
            'maxResults': max_results,
            'sort': 'FIRST_TO_START'
        }
        
        if event_ids:
            data['filter']['eventIds'] = event_ids
        
        response = self._make_request('listMarketCatalogue/', method='POST', data=data)
        return response.get('result', [])
    
    def list_market_book(
        self,
        market_ids: List[str],
        price_projection: dict = None,
        order_projection: str = 'ALL',
        match_projection: str = 'ROLLED_UP_BY_PRICE',
        currency_code: str = 'USD'
    ) -> List[dict]:
        """Get market book with odds and other data"""
        self.ensure_authenticated()
        
        if not market_ids:
            return []
            
        if price_projection is None:
            price_projection = {
                'priceData': ['EX_BEST_OFFERS', 'EX_ALL_OFFERS', 'EX_TRADED'],
                'virtualise': False
            }
        
        data = {
            'marketIds': market_ids,
            'priceProjection': price_projection,
            'orderProjection': order_projection,
            'matchProjection': match_projection,
            'currencyCode': currency_code
        }
        
        response = self._make_request('listMarketBook/', method='POST', data=data)
        return response.get('result', [])
    
    def place_orders(
        self,
        market_id: str,
        instructions: List[dict],
        customer_ref: str = None,
        market_version: dict = None,
        customer_strategy_ref: str = None,
        async_: bool = False
    ) -> dict:
        """Place one or more orders on a market"""
        self.ensure_authenticated()
        
        if not customer_ref:
            customer_ref = f"firehorse_{int(datetime.utcnow().timestamp())}"
        
        data = {
            'marketId': market_id,
            'instructions': instructions,
            'customerRef': customer_ref,
            'async': async_
        }
        
        if market_version:
            data['marketVersion'] = market_version
            
        if customer_strategy_ref:
            data['customerStrategyRef'] = customer_strategy_ref
        
        response = self._make_request('placeOrders/', method='POST', data=data)
        return response.get('result', {})
    
    def get_account_funds(self, wallet: str = 'UK') -> dict:
        """Get available funds in the account"""
        self.ensure_authenticated()
        
        data = {
            'wallet': wallet
        }
        
        response = self._make_request('getAccountFunds/', method='POST', data=data)
        return response.get('result', {})
    
    def get_account_statement(
        self,
        from_record: int = 0,
        record_count: int = 100,
        item_date_range: dict = None,
        include_item: str = 'ALL',
        wallet: str = 'UK'
    ) -> dict:
        """Get account statement"""
        self.ensure_authenticated()
        
        if item_date_range is None:
            item_date_range = {
                'from': (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                'to': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')
            }
        
        data = {
            'fromRecord': from_record,
            'recordCount': record_count,
            'itemDateRange': item_date_range,
            'includeItem': include_item,
            'wallet': wallet
        }
        
        response = self._make_request('getAccountStatement/', method='POST', data=data)
        return response.get('result', {})
