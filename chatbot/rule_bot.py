import re
import requests
import datetime
from utils.predict import predict_price

def call_llm_api(message):
    """
    Attempts to hit a free Hugging Face API without authentication.
    Fails exceptionally fast via timeout if ratelimits trigger.
    """
    try:
        API_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill"
        payload = {"inputs": message}
        response = requests.post(API_URL, json=payload, timeout=2.5)
        if response.status_code == 200:
            return response.json()[0]['generated_text']
    except Exception:
        pass
    return None

def fallback_general_qa(message):
    """
    A robust rule-based NLP fallback engine ensuring 100% stable conversational context 
    without "I don't understand" responses.
    """
    msg = message.lower()
    
    if any(greet in msg for greet in ["hello", "hi", "hey"]):
        return "Hello! I am your AI flight assistant. How can I help you today?"
    if "who are you" in msg:
        return "I am AeroInsight Pro, a hybrid ML agent created to predict flight pricing using advanced regression models."
    if "pm of india" in msg or "prime minister" in msg:
        return "The Prime Minister of India is Narendra Modi."
    if "today" in msg and "what" in msg:
        td = datetime.datetime.now().strftime("%A, %B %d, %Y")
        return f"Today is {td}."
    if "book now" in msg or "should i book" in msg:
        return "It completely depends on the route! Try phrasing your query like: 'Predict flight from Delhi to Mumbai tomorrow'."
    
    return "I am highly trained in aviation dynamics! Tell me your departure and destination cities to initiate a real-time ML prediction."

def extract_flight_info(message):
    cities = ["delhi", "mumbai", "bangalore", "kolkata", "chennai"]
    
    # NLP Regex formatting capturing spatial orientation e.g. "from ... to ..."
    pattern = r"(?:from\s+)?([A-Za-z]+)\s+to\s+([A-Za-z]+)"
    match = re.search(pattern, message.lower())
    
    if match:
        src, dest = match.groups()
        if src in cities and dest in cities:
            return src.capitalize(), dest.capitalize()
            
    # Greedy inclusion fallback
    found_cities = [c.capitalize() for c in cities if c in message.lower()]
    if len(found_cities) >= 2:
        return found_cities[0], found_cities[1]
        
    return None, None

def get_chat_response(message: str) -> str:
    msg_low = message.lower()
    
    # 1. Intent Route Detection
    flight_keywords = ["flight", "from", "to", "ticket", "travel", "delhi", "mumbai", "bangalore", "kolkata", "chennai", "book"]
    
    is_flight_intent = False
    if any(keyword in msg_low for keyword in flight_keywords):
        src, dest = extract_flight_info(message)
        if src and dest:
            is_flight_intent = True

    # 2. Flight Prediction Sequence Controller
    if is_flight_intent:
        src, dest = extract_flight_info(message)
        if not src or not dest:
            return "I couldn't quite catch the structural context. Try stating valid routing paths like 'Delhi to Mumbai'."

        # Explicit NLP Date Generation Framework
        days_left = 1
        if "tomorrow" in msg_low:
            days_left = 1
        elif "next week" in msg_low:
            days_left = 7
        elif "today" in msg_low:
            days_left = 0

        travel_date = datetime.datetime.now() + datetime.timedelta(days=days_left)

        payload = {
            "source": src,
            "destination": dest,
            "airline": "IndiGo", # Constant baseline wrapper inside chat evaluations
            "total_stops": 0,
            "duration_minutes": 120,
            "departure_hour": 8,
            "day_of_week": travel_date.weekday(),
            "month": travel_date.month,
            "is_weekend": 1 if travel_date.weekday() in [5, 6] else 0,
            "days_left": days_left
        }

        try:
            price, recommendation, conf, price_range = predict_price(payload)
            target_date_str = travel_date.strftime("%B %d")
            return (
                f"✈️ Scanning flights from {src} to {dest} for {target_date_str}...\n\n"
                f"My underlying model predicts base-tier tickets at roughly **₹{price}** "
                f"with an algorithmic confidence of {conf}%. "
                f"Price range: {price_range}. {recommendation}"
            )
        except Exception as e:
            return "Oops! My prediction engine encountered a fault while scaling the array inputs. Try again shortly."

    # 3. Hybrid AI NLP Conversational Fallback Sequence
    llm_resp = call_llm_api(message)
    if llm_resp:
        return llm_resp
        
    return fallback_general_qa(message)
