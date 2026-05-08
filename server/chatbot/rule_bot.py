import re
import sys
import os
import datetime

# Ensure server/ root is on the path so 'from utils.predict' resolves correctly
_server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

from utils.predict import predict_price


def call_llm_api(message):
    """
    Hits HuggingFace Router API using the openai-compatible client.
    Uses google/gemma-4-31B-it via Novita provider.
    Requires HF_TOKEN environment variable.
    """
    try:
        import os
        from openai import OpenAI

        hf_token = os.environ.get("HF_TOKEN")
        if not hf_token:
            print("HF_TOKEN not set — skipping LLM call.")
            return None

        client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=hf_token,
        )

        completion = client.chat.completions.create(
            model="google/gemma-4-31B-it:novita",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Omniscient AI, an all-knowing assistant integrated into a flight "
                        "prediction application. You analyze global market trends and historical data. "
                        "If asked about your name, explain that 'Omniscient' means all-knowing or having "
                        "infinite awareness. Be helpful, concise, and professional. When providing prices, "
                        "always use the ₹ symbol (e.g., ₹5000) for Indian flights."
                    )
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            max_tokens=300,
        )

        return completion.choices[0].message.content

    except Exception as e:
        print(f"HuggingFace LLM API Error: {e}")
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
    cities = ["delhi", "mumbai", "bangalore", "kolkata", "chennai", "hyderabad", "ahmedabad", "pune", "goa", "jaipur"]
    
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
        "flight", "from", "to", "ticket", "travel", "delhi", "mumbai", "bangalore", "kolkata", "chennai", 
        "hyderabad", "ahmedabad", "pune", "goa", "jaipur", "book", "airline", "fare", "price"
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
        date_match = re.search(r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})", msg_low)
        
        if date_match:
            try:
                day, month, year = map(int, date_match.groups())
                target_date = datetime.datetime(year, month, day)
                today = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                diff = (target_date - today).days
                days_left = max(0, diff)
            except ValueError:
                days_left = 1
        elif "tomorrow" in msg_low:
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
            price, recommendation, conf, price_range, metrics = predict_price(payload)
            mse = metrics.get('mse', 'N/A')
            volatility = metrics.get('volatility', 'N/A')
            
            target_date_str = travel_date.strftime("%B %d")
            return (
                f"✈️ Scanning flights from {src} to {dest} for {target_date_str}...\n\n"
                f"Omniscient Intelligence predicts base-tier tickets at roughly **₹{price}** "
                f"with a model confidence of {conf}%. \n\n"
                f"**Market Analysis:** {recommendation}\n"
                f"**Technical Metrics:** MSE: {mse} | Volatility: {volatility}"
            )
        except Exception as e:
            print(f"Chat Predict Error: {e}")
            return "Oops! My prediction engine encountered a synchronization fault while processing the market array. Try again shortly with 'Delhi to Mumbai tomorrow'."

    # 3. Hybrid AI NLP Conversational Fallback Sequence
    llm_resp = call_llm_api(message)
    if llm_resp:
        return llm_resp
        
    return fallback_general_qa(message)
