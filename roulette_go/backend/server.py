from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pathlib import Path
import os
import json
import uuid
import bcrypt
import jwt
import asyncio
import logging
from playwright.async_api import async_playwright
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT configuration
SECRET_KEY = "sua-chave-secreta-aqui"
ALGORITHM = "HS256"

# FastAPI app
app = FastAPI(title="Sistema de Apostas Automáticas na Roleta")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Pydantic models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password: str
    role: str = "user"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str
    site: str = "blaze.bet.br"

class UserTicket(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    credits: int = 100
    cost_per_interaction: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BetRound(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    bet_color: str
    bet_amount: float
    result: str
    profit: float = 0.0
    strategy: str = "manual"
    site: str = "blaze.bet.br"
    game: str = "mega_fire_blaze"

class AutomationConfig(BaseModel):
    site: str = "blaze.bet.br"
    game: str = "mega_fire_blaze"
    strategy: str = "martingale"
    initial_bet: float = 1.0
    max_steps: int = 10
    target_color: str = "red"
    mode: str = "simulation"  # simulation or real
    credentials: Optional[Dict[str, str]] = None

class Strategy(BaseModel):
    name: str
    initial_bet: float
    multiplier: float = 2.0
    max_steps: int = 10
    reset_on_win: bool = True

# Site configurations
SITE_CONFIGS = {
    "blaze.bet.br": {
        "url": "https://blaze.com",
        "selectors": {
            "login_email": "input[name='email']",
            "login_password": "input[name='password']",
            "login_button": "button[type='submit']",
            "bet_red": "[data-testid='bet-red']",
            "bet_black": "[data-testid='bet-black']",
            "bet_amount": "input[name='amount']",
            "confirm_bet": "[data-testid='confirm-bet']",
            "game_result": "[data-testid='result']"
        }
    }
}

# Strategies
STRATEGIES = {
    "martingale": {
        "name": "Martingale",
        "initial_bet": 1.0,
        "multiplier": 2.0,
        "max_steps": 10,
        "reset_on_win": True
    },
    "fibonacci": {
        "name": "Fibonacci",
        "initial_bet": 1.0,
        "multiplier": 1.618,
        "max_steps": 15,
        "reset_on_win": True
    },
    "flat": {
        "name": "Flat Betting",
        "initial_bet": 1.0,
        "multiplier": 1.0,
        "max_steps": 100,
        "reset_on_win": False
    }
}

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"username": username})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Automation engine
class RouletteBot:
    def __init__(self, config: AutomationConfig, user_id: str):
        self.config = config
        self.user_id = user_id
        self.current_bet = config.initial_bet
        self.step_count = 0
        self.is_running = False
        self.strategy = STRATEGIES.get(config.strategy, STRATEGIES["martingale"])
        
    async def simulate_bet(self, color: str, amount: float) -> dict:
        """Simulate a bet for demo purposes"""
        import random
        await asyncio.sleep(2)  # Simulate betting time
        
        result_color = random.choice(["red", "black", "green"])
        won = result_color == color
        profit = amount if won else -amount
        
        return {
            "color": color,
            "amount": amount,
            "result": result_color,
            "won": won,
            "profit": profit
        }
    
    async def real_bet(self, color: str, amount: float) -> dict:
        """Real betting using Playwright"""
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                
                site_config = SITE_CONFIGS[self.config.site]
                
                # Navigate to site
                await page.goto(site_config["url"])
                
                # Login if credentials provided
                if self.config.credentials:
                    await page.fill(site_config["selectors"]["login_email"], self.config.credentials["email"])
                    await page.fill(site_config["selectors"]["login_password"], self.config.credentials["password"])
                    await page.click(site_config["selectors"]["login_button"])
                    await page.wait_for_load_state("networkidle")
                
                # Place bet
                await page.fill(site_config["selectors"]["bet_amount"], str(amount))
                
                color_selector = site_config["selectors"][f"bet_{color}"]
                await page.click(color_selector)
                await page.click(site_config["selectors"]["confirm_bet"])
                
                # Wait for result
                await page.wait_for_selector(site_config["selectors"]["game_result"])
                result_element = await page.query_selector(site_config["selectors"]["game_result"])
                result_text = await result_element.text_content()
                
                await browser.close()
                
                # Parse result
                result_color = self.parse_result(result_text)
                won = result_color == color
                profit = amount if won else -amount
                
                return {
                    "color": color,
                    "amount": amount,
                    "result": result_color,
                    "won": won,
                    "profit": profit
                }
                
        except Exception as e:
            logger.error(f"Error in real betting: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Betting error: {str(e)}")
    
    def parse_result(self, result_text: str) -> str:
        """Parse the result from the game"""
        result_lower = result_text.lower()
        if "red" in result_lower or "vermelho" in result_lower:
            return "red"
        elif "black" in result_lower or "preto" in result_lower:
            return "black"
        else:
            return "green"
    
    async def execute_strategy(self):
        """Execute the configured strategy"""
        self.is_running = True
        
        while self.is_running and self.step_count < self.strategy["max_steps"]:
            try:
                # Choose betting method
                if self.config.mode == "simulation":
                    result = await self.simulate_bet(self.config.target_color, self.current_bet)
                else:
                    result = await self.real_bet(self.config.target_color, self.current_bet)
                
                # Save bet to database
                bet_round = BetRound(
                    user_id=self.user_id,
                    bet_color=result["color"],
                    bet_amount=result["amount"],
                    result=result["result"],
                    profit=result["profit"],
                    strategy=self.config.strategy,
                    site=self.config.site,
                    game=self.config.game
                )
                
                await db.rounds.insert_one(bet_round.dict())
                
                # Update user credits
                await db.tickets.update_one(
                    {"user_id": self.user_id},
                    {"$inc": {"credits": -1}}
                )
                
                # Send update via WebSocket
                bet_data = bet_round.dict()
                # Convert datetime to string for JSON serialization
                if "timestamp" in bet_data:
                    bet_data["timestamp"] = bet_data["timestamp"].isoformat()
                
                await manager.broadcast(json.dumps({
                    "type": "bet_result",
                    "data": bet_data
                }))
                
                # Update strategy
                if result["won"]:
                    if self.strategy["reset_on_win"]:
                        self.current_bet = self.strategy["initial_bet"]
                        self.step_count = 0
                    else:
                        self.step_count += 1
                else:
                    self.current_bet *= self.strategy["multiplier"]
                    self.step_count += 1
                
                # Wait before next bet
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error in strategy execution: {str(e)}")
                await manager.broadcast(json.dumps({
                    "type": "error",
                    "message": str(e)
                }))
                break
        
        self.is_running = False
        await manager.broadcast(json.dumps({
            "type": "automation_stopped",
            "message": "Automação finalizada"
        }))

# API Routes
@api_router.post("/register")
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create user
    hashed_password = hash_password(user_data.password)
    user = User(
        username=user_data.username,
        password=hashed_password
    )
    
    await db.users.insert_one(user.dict())
    
    # Create user ticket
    ticket = UserTicket(user_id=user.id)
    await db.tickets.insert_one(ticket.dict())
    
    return {"message": "User registered successfully"}

@api_router.post("/login")
async def login(user_data: UserLogin):
    """Login user"""
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["username"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"]
        }
    }

@api_router.get("/sites")
async def get_sites():
    """Get available sites"""
    return list(SITE_CONFIGS.keys())

@api_router.get("/strategies")
async def get_strategies():
    """Get available strategies"""
    return STRATEGIES

@api_router.get("/user/tickets")
async def get_user_tickets(current_user: dict = Depends(get_current_user)):
    """Get user tickets/credits"""
    ticket = await db.tickets.find_one({"user_id": current_user["id"]})
    if ticket:
        # Convert ObjectId to string and handle datetime
        if "_id" in ticket:
            ticket["_id"] = str(ticket["_id"])
        if "created_at" in ticket:
            ticket["created_at"] = ticket["created_at"].isoformat()
        return ticket
    return {"credits": 0}

@api_router.get("/user/history")
async def get_user_history(current_user: dict = Depends(get_current_user)):
    """Get user betting history"""
    rounds = await db.rounds.find({"user_id": current_user["id"]}).sort("timestamp", -1).limit(100).to_list(100)
    # Convert ObjectId to string and handle datetime
    for round_data in rounds:
        if "_id" in round_data:
            round_data["_id"] = str(round_data["_id"])
        if "timestamp" in round_data:
            round_data["timestamp"] = round_data["timestamp"].isoformat()
    return rounds

@api_router.post("/start-automation")
async def start_automation(config: AutomationConfig, current_user: dict = Depends(get_current_user)):
    """Start automation"""
    # Check user credits
    ticket = await db.tickets.find_one({"user_id": current_user["id"]})
    if not ticket or ticket["credits"] < 10:
        raise HTTPException(status_code=400, detail="Insufficient credits")
    
    # Create and start bot
    bot = RouletteBot(config, current_user["id"])
    asyncio.create_task(bot.execute_strategy())
    
    return {"message": "Automation started", "mode": config.mode}

@api_router.post("/admin/add-credits")
async def add_credits(user_id: str, credits: int, current_user: dict = Depends(get_current_user)):
    """Add credits to user (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.tickets.update_one(
        {"user_id": user_id},
        {"$inc": {"credits": credits}}
    )
    
    return {"message": f"Added {credits} credits to user {user_id}"}

@api_router.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    """Get all users (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"password": 0}).to_list(100)
    # Convert ObjectId to string and handle datetime
    for user in users:
        if "_id" in user:
            user["_id"] = str(user["_id"])
        if "created_at" in user:
            user["created_at"] = user["created_at"].isoformat()
    return users

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_message(f"Message: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Initialize admin user
@app.on_event("startup")
async def startup_event():
    """Initialize admin user and default data"""
    admin_user = await db.users.find_one({"username": "admin"})
    if not admin_user:
        admin = User(
            username="admin",
            password=hash_password("Admin123!"),
            role="admin"
        )
        await db.users.insert_one(admin.dict())
        
        # Create admin ticket
        ticket = UserTicket(user_id=admin.id, credits=10000)
        await db.tickets.insert_one(ticket.dict())
        
        logger.info("Admin user created: admin/Admin123!")

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include router
app.include_router(api_router)

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)