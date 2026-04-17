from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils.predict import predict_price
from chatbot.rule_bot import get_chat_response

app = FastAPI(title="AI Flight Predictor & Chat")

# Configure CORS for all origins, required since frontend may run from Vercel or locally
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
    date: str
    airline: str
    stops: int
    duration: int = 120

class ChatQuery(BaseModel):
    message: str

@app.get("/")
def root():
    return {"message": "AI Flight Predictor API is running."}

@app.post("/predict")
def predict(query: FlightQuery):
    price, recommendation = predict_price(query.model_dump())
    return {
        "predicted_price": round(price, 2),
        "recommendation": recommendation
    }

@app.post("/chat")
def chat(query: ChatQuery):
    reply = get_chat_response(query.message)
    return {"reply": reply}
