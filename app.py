from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils.predict import predict_price
from chatbot.rule_bot import get_chat_response
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_logger")

app = FastAPI(title="AI Flight Predictor & Chat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Error handling request: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"error": "Internal Server Error", "details": str(e)})

class FlightQuery(BaseModel):
    source: str
    destination: str
    date: str
    airline: str
    total_stops: int
    duration_minutes: int = 120

class ChatQuery(BaseModel):
    message: str

@app.get("/")
def root():
    return {"message": "AI Flight Predictor API is running."}

@app.get("/test")
def test_route():
    return {"message": "Backend working"}

@app.post("/predict")
def predict(query: FlightQuery):
    try:
        price, recommendation = predict_price(query.model_dump())
        return {
            "predicted_price": round(price, 2),
            "recommendation": recommendation
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
