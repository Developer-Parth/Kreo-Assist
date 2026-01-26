from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.utcnow().timestamp()))
    type: str  # "emergency", "warning", "info"
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False

class SystemStatus(BaseModel):
    current_status: str  # "SAFE", "WARNING", "EMERGENCY"
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.utcnow().timestamp()))
    description: str
    event_type: str  # "alert", "status_change", "connection"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ConnectionStatus(BaseModel):
    is_connected: bool
    last_ping: datetime = Field(default_factory=datetime.utcnow)

class AcknowledgeRequest(BaseModel):
    alert_id: str

# Initialize with default data
async def initialize_default_data():
    # Check if data exists
    status_count = await db.system_status.count_documents({})
    if status_count == 0:
        # Create default status
        default_status = SystemStatus(
            current_status="SAFE",
            description="All systems operating normally"
        )
        await db.system_status.insert_one(default_status.dict())
        
        # Create default connection status
        default_connection = ConnectionStatus(is_connected=True)
        await db.connection_status.insert_one(default_connection.dict())
        
        # Create some initial events
        events = [
            Event(
                description="System initialized",
                event_type="status_change",
                timestamp=datetime.utcnow() - timedelta(hours=2)
            ),
            Event(
                description="Device connected successfully",
                event_type="connection",
                timestamp=datetime.utcnow() - timedelta(hours=1, minutes=30)
            )
        ]
        for event in events:
            await db.events.insert_one(event.dict())

@app.on_event("startup")
async def startup_event():
    await initialize_default_data()

# Alert endpoints
@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts():
    """Get all alerts, sorted by timestamp descending"""
    alerts = await db.alerts.find().sort("timestamp", -1).limit(50).to_list(50)
    return [Alert(**alert) for alert in alerts]

@api_router.get("/alerts/latest")
async def get_latest_alert():
    """Get the latest unacknowledged alert"""
    alert = await db.alerts.find_one(
        {"acknowledged": False},
        sort=[("timestamp", -1)]
    )
    if alert:
        return Alert(**alert)
    return None

@api_router.post("/alerts/acknowledge")
async def acknowledge_alert(request: AcknowledgeRequest):
    """Acknowledge an alert"""
    result = await db.alerts.update_one(
        {"id": request.alert_id},
        {"$set": {"acknowledged": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Add event for acknowledgement
    event = Event(
        description=f"Alert acknowledged",
        event_type="alert"
    )
    await db.events.insert_one(event.dict())
    
    return {"success": True, "message": "Alert acknowledged"}

# Status endpoints
@api_router.get("/status")
async def get_status():
    """Get current system status"""
    status = await db.system_status.find_one(sort=[("last_updated", -1)])
    if status:
        return SystemStatus(**status)
    return SystemStatus(current_status="SAFE")

@api_router.post("/status")
async def update_status(status: SystemStatus):
    """Update system status (for simulation)"""
    await db.system_status.insert_one(status.dict())
    
    # Add event for status change
    event = Event(
        description=f"Status changed to {status.current_status}",
        event_type="status_change"
    )
    await db.events.insert_one(event.dict())
    
    return status

# Event endpoints
@api_router.get("/events", response_model=List[Event])
async def get_events():
    """Get event log, sorted by timestamp descending"""
    events = await db.events.find().sort("timestamp", -1).limit(100).to_list(100)
    return [Event(**event) for event in events]

@api_router.post("/events")
async def add_event(event: Event):
    """Add event to log (for simulation)"""
    await db.events.insert_one(event.dict())
    return event

# Connection endpoints
@api_router.get("/connection")
async def get_connection_status():
    """Get device connection status"""
    connection = await db.connection_status.find_one(sort=[("last_ping", -1)])
    if connection:
        # Check if last ping was within last 5 minutes
        last_ping = connection.get('last_ping')
        if isinstance(last_ping, datetime):
            time_diff = datetime.utcnow() - last_ping
            is_connected = time_diff < timedelta(minutes=5)
            connection['is_connected'] = is_connected
        return ConnectionStatus(**connection)
    return ConnectionStatus(is_connected=False)

@api_router.post("/connection")
async def update_connection(connection: ConnectionStatus):
    """Update connection status"""
    await db.connection_status.insert_one(connection.dict())
    
    # Add event for connection change
    event_desc = "Device connected" if connection.is_connected else "Device disconnected"
    event = Event(
        description=event_desc,
        event_type="connection"
    )
    await db.events.insert_one(event.dict())
    
    return connection

# Simulation endpoints
@api_router.post("/simulate/emergency")
async def simulate_emergency():
    """Simulate an emergency alert"""
    alert = Alert(
        type="emergency",
        description="Emergency: User needs immediate assistance"
    )
    await db.alerts.insert_one(alert.dict())
    
    # Update status to emergency
    status = SystemStatus(
        current_status="EMERGENCY",
        description="Emergency alert triggered"
    )
    await db.system_status.insert_one(status.dict())
    
    # Add event
    event = Event(
        description="EMERGENCY ALERT: Immediate assistance required",
        event_type="alert"
    )
    await db.events.insert_one(event.dict())
    
    return {"success": True, "alert": alert}

@api_router.post("/simulate/warning")
async def simulate_warning():
    """Simulate a warning alert"""
    warnings = [
        "Warning: Obstacle detected ahead",
        "Warning: Battery level low (20%)",
        "Warning: Unusual movement pattern detected"
    ]
    
    alert = Alert(
        type="warning",
        description=random.choice(warnings)
    )
    await db.alerts.insert_one(alert.dict())
    
    # Update status to warning
    status = SystemStatus(
        current_status="WARNING",
        description="Warning condition detected"
    )
    await db.system_status.insert_one(status.dict())
    
    # Add event
    event = Event(
        description=alert.description,
        event_type="alert"
    )
    await db.events.insert_one(event.dict())
    
    return {"success": True, "alert": alert}

@api_router.post("/simulate/safe")
async def simulate_safe():
    """Set status back to safe"""
    status = SystemStatus(
        current_status="SAFE",
        description="All systems operating normally"
    )
    await db.system_status.insert_one(status.dict())
    
    # Add event
    event = Event(
        description="System status returned to normal",
        event_type="status_change"
    )
    await db.events.insert_one(event.dict())
    
    return {"success": True, "status": status}

@api_router.get("/")
async def root():
    return {"message": "KreoAssist API - Caregiver Monitoring System"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
