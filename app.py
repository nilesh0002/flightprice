from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils.predict import predict_price
from chatbot.rule_bot import get_chat_response

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FlightQuery(BaseModel):
    source: str
    destination: str
    airline: str
    total_stops: int
    duration_minutes: int
    departure_hour: int
    day_of_week: int
    month: int
    is_weekend: int
    days_left: int
    date: str = "" # Fallback

class ChatQuery(BaseModel):
    message: str

@app.get("/")
def root():
    return {"message": "AI Flight Predictor API is running."}

@app.get("/test")
def test():
    return {"message": "Backend working"}

@app.post("/predict")
def predict(query: FlightQuery):
    try:
        price, recommendation, confidence, price_range = predict_price(query.model_dump())
        return {
            "predicted_price": round(price, 2),
            "recommendation": recommendation,
            "confidence": confidence,
            "price_range": price_range,
            "avg_price": round(price * 1.15, 2) # Synthetic average for UI trend
        }
    except Exception as e:
        if "Model not available" in str(e):
            return {"error": "Model not available"}
        return {"error": str(e)}

@app.post("/chat")
def chat(query: ChatQuery):
    try:
        reply = get_chat_response(query.message)
        return {"reply": reply}
    except Exception as e:
        return {"error": str(e)}
