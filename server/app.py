import os
import time
from collections import defaultdict
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List

try:
    from utils.predict import predict_price, load_model
    from chatbot.rule_bot import get_chat_response
    from constants import (
        SUPPORTED_AIRLINES,
        SUPPORTED_SOURCES,
        SUPPORTED_DESTINATIONS,
        SUPPORTED_STOPS,
        SUPPORTED_CABINS,
        SUPPORTED_CHAT_MODES,
    )
except ImportError:
    from server.utils.predict import predict_price, load_model
    from server.chatbot.rule_bot import get_chat_response
    from server.constants import (
        SUPPORTED_AIRLINES,
        SUPPORTED_SOURCES,
        SUPPORTED_DESTINATIONS,
        SUPPORTED_STOPS,
        SUPPORTED_CABINS,
        SUPPORTED_CHAT_MODES,
    )

app = FastAPI(title="AeroMind Flight Price Prediction API", version="1.0.0")

if os.environ.get("VERCEL"):
    app.root_path = "/api"

# CORS configuration restricted via environment variable
raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://flightprice-sghf.onrender.com"
)
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Chat rate limiter: max 30 requests per minute per IP
CHAT_RATE_LIMIT = 30
CHAT_WINDOW_SECONDS = 60
_chat_request_history = defaultdict(list)

def check_chat_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    history = _chat_request_history[client_ip]
    # Prune old timestamps
    _chat_request_history[client_ip] = [t for t in history if now - t < CHAT_WINDOW_SECONDS]
    
    if len(_chat_request_history[client_ip]) >= CHAT_RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait a minute before sending more messages."
        )
    _chat_request_history[client_ip].append(now)

class FlightQuery(BaseModel):
    airline: str = Field(..., description="Operating airline")
    source: str = Field(..., description="Origin city")
    destination: str = Field(..., description="Destination city")
    total_stops: int = Field(0, ge=0, le=4, description="Number of stops (0 to 4)")
    duration_minutes: int = Field(120, ge=10, le=3000, description="Flight duration in minutes")
    departure_hour: int = Field(8, ge=0, le=23, description="Departure hour (0-23)")
    day_of_week: int = Field(5, ge=0, le=6, description="Day of week (0-6)")
    month: int = Field(5, ge=1, le=12, description="Month of journey (1-12)")
    is_weekend: int = Field(0, ge=0, le=1, description="Weekend indicator (0 or 1)")
    days_left: int = Field(30, ge=0, le=365, description="Days until flight departure")
    date: str = Field("", description="ISO date format YYYY-MM-DD")
    cabin: str = Field("Economy", description="Cabin class")
    passengers: str = Field("1", description="Passenger count")
    reason: Optional[str] = "Vacation"
    extra: Optional[str] = "Basic"
    departureWindow: Optional[str] = "Morning"
    isFestival: Optional[str] = "No"
    membership: Optional[str] = "Guest"
    amenities: Optional[str] = "None"

    @field_validator("source", "destination", "airline")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        return v.strip()

class ChatQuery(BaseModel):
    message: str = Field(..., min_length=1, max_length=500, description="User query (max 500 characters)")
    model: str = Field("general", description="Chat model persona")

@app.get("/")
def root():
    return {"status": "ok", "message": "AeroMind Flight Prediction API is operational."}

@app.get("/categories")
def get_categories():
    return {
        "airlines": SUPPORTED_AIRLINES,
        "sources": SUPPORTED_SOURCES,
        "destinations": SUPPORTED_DESTINATIONS,
        "stops": SUPPORTED_STOPS,
        "cabins": SUPPORTED_CABINS,
        "chat_modes": SUPPORTED_CHAT_MODES
    }

@app.get("/metrics")
def metrics():
    model_data = load_model()
    if not model_data or "metrics" not in model_data:
        raise HTTPException(status_code=503, detail="Model metrics currently unavailable.")
    return model_data["metrics"]

@app.get("/charts")
def charts():
    model_data = load_model()
    if not model_data or "charts" not in model_data:
        raise HTTPException(status_code=503, detail="Chart analytics currently unavailable.")
    return model_data["charts"]

@app.post("/predict")
def predict(query: FlightQuery):
    # Strict validation of origin vs destination
    if query.source.strip().lower() == query.destination.strip().lower():
        raise HTTPException(
            status_code=400,
            detail=f"Source and destination cannot be identical ('{query.source}')."
        )

    # Validate supported categories
    if query.airline not in SUPPORTED_AIRLINES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported airline '{query.airline}'. Supported: {', '.join(SUPPORTED_AIRLINES)}"
        )
    if query.source not in SUPPORTED_SOURCES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported source '{query.source}'. Supported: {', '.join(SUPPORTED_SOURCES)}"
        )
    if query.destination not in SUPPORTED_DESTINATIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported destination '{query.destination}'. Supported: {', '.join(SUPPORTED_DESTINATIONS)}"
        )

    try:
        price, recommendation, confidence, price_range, metrics_dict = predict_price(query.model_dump())
        return {
            "predicted_price": round(price, 2),
            "recommendation": recommendation,
            "confidence": confidence,
            "price_range": price_range,
            "metrics": metrics_dict
        }
    except RuntimeError as e:
        if "Model not available" in str(e):
            raise HTTPException(status_code=503, detail="Prediction model is not loaded.")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while generating prediction.")

@app.post("/chat")
def chat(query: ChatQuery, _rate_limit: None = Depends(check_chat_rate_limit)):
    clean_model = query.model.strip().lower()
    if clean_model not in SUPPORTED_CHAT_MODES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid chatbot mode '{query.model}'. Allowed modes: {', '.join(SUPPORTED_CHAT_MODES)}"
        )
    try:
        reply = get_chat_response(query.message, clean_model)
        return {"reply": reply}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process chat response.")
