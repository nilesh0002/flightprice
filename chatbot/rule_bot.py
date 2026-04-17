import re
import requests
import datetime
from utils.predict import predict_price

def call_llm_api(message):
    """
    Hits a free LLM endpoint using text.pollinations.ai to act like a real AI (ChatGPT).
    Uses urllib directly to avoid any CA certificate bundle issues on the local system.
    Implements role-based context to mimic ChatGPT.
    """
    try:
        import urllib.request
        import json
        import ssl
        
        # Bypass SSL verification to avoid local CA bundle issues
        ctx = ssl._create_unverified_context()
        
        url = "https://text.pollinations.ai/"
        
        # Implementing role-based context to act exactly like Omni-bot
        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are Omniscient AI, an all-knowing assistant integrated into a flight prediction application. You analyze global market trends and historical data. If asked about your name, explain that 'Omniscient' means all-knowing or having infinite awareness. Be helpful, concise, and professional."
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            "model": "openai"
        }
        
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url, 
            data=data, 
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        )
        
        response = urllib.request.urlopen(req, timeout=15, context=ctx)
        return response.read().decode('utf-8')
    except Exception as e:
        print(f"LLM API Error: {e}")
        return None

def fallback_general_qa(message):
    """
    A robust rule-based NLP fallback engine ensuring 100% stable conversational context 
    without "I don't understand" responses.
    """
    msg = message.lower()

    greetings = ["hello", "hi", "hey", "greetings", "good morning", "good evening"]
    if any(greet in msg for greet in greetings):
        return "Hello! I am Omniscient AI. How can I guide your journey today?"
    if "who are you" in msg or "your name" in msg:
        return "I am Omniscient AI, an all-knowing market predictor that analyzes massive flight datasets to forecast pricing."
    if "meaning" in msg and ("name" in msg or "omniscient" in msg):
        return "The term 'Omniscient' is derived from Latin, meaning 'all-knowing.' It represents my ability to process and analyze vast streams of historical flight data simultaneously."
    if "pm of india" in msg or "prime minister" in msg:
        return "The Prime Minister of India is Narendra Modi."
    if ("today" in msg and "what" in msg) or ("day" in msg and "today" in msg):
        td = datetime.datetime.now().strftime("%A, %B %d, %Y")
        return f"Today is {td}."
    if "book now" in msg or "should i book" in msg or ("buy" in msg and "ticket" in msg):
        return "It depends on your route and timing! Try: 'Predict flight from Delhi to Mumbai tomorrow'."
    if "help" in msg or "support" in msg:
        return "You can ask me about flight prices, booking tips, or general questions like 'Who are you?'."

    # Fallback: encourage flight prediction
    return "I'm here to help with flight price predictions and travel queries! Tell me your departure and destination cities to get started."

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
    # Expanded keyword set for better intent detection
    flight_keywords = [
        "flight", "from", "to", "ticket", "travel", "delhi", "mumbai", "bangalore", "kolkata", "chennai", "book",
        "airline", "fare", "price", "cost", "journey", "trip", "departure", "arrival", "stop", "stops"
    ]

    is_flight_intent = False
    if any(re.search(rf"\b{re.escape(keyword)}\b", msg_low) for keyword in flight_keywords):
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
