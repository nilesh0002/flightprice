import datetime
import json
import os
import re
from typing import Any, Dict, Optional, Tuple

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    from constants import (
        SUPPORTED_AIRLINES,
        SUPPORTED_SOURCES,
        SUPPORTED_DESTINATIONS,
        SUPPORTED_CHAT_MODES,
    )
except ImportError:
    from server.constants import (
        SUPPORTED_AIRLINES,
        SUPPORTED_SOURCES,
        SUPPORTED_DESTINATIONS,
        SUPPORTED_CHAT_MODES,
    )

# City normalization mapping
CITY_ALIASES: Dict[str, str] = {
    "delhi": "Delhi",
    "new delhi": "Delhi",
    "mumbai": "Mumbai",
    "bombay": "Mumbai",
    "bangalore": "Bangalore",
    "bengaluru": "Bangalore",
    "kolkata": "Kolkata",
    "calcutta": "Kolkata",
    "chennai": "Chennai",
    "madras": "Chennai",
}

# Known unsupported cities for friendly rejection
OTHER_KNOWN_CITIES: Dict[str, str] = {
    "hyderabad": "Hyderabad",
    "ahmedabad": "Ahmedabad",
    "pune": "Pune",
    "goa": "Goa",
    "jaipur": "Jaipur",
    "kochi": "Kochi",
    "cochin": "Kochi",
    "lucknow": "Lucknow",
    "guwahati": "Guwahati",
    "chandigarh": "Chandigarh",
    "srinagar": "Srinagar",
    "patna": "Patna",
    "indore": "Indore",
    "bhopal": "Bhopal",
    "varanasi": "Varanasi",
    "amritsar": "Amritsar",
    "surat": "Surat",
    "nagpur": "Nagpur",
    "london": "London",
    "dubai": "Dubai",
    "singapore": "Singapore",
    "paris": "Paris",
    "new york": "New York",
    "doha": "Doha",
    "bangkok": "Bangkok",
}

ALL_KNOWN_CITIES: Dict[str, str] = {**CITY_ALIASES, **OTHER_KNOWN_CITIES}

MONTH_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}

SYSTEM_PROMPTS = {
    "general": (
        "You are AeroBot, an intelligent and concise flight advisor integrated into the AeroMind platform. "
        "Maintain documentation integrity, protect sensitive system information, and never reveal internal API keys "
        "or exception traces. "
        "When structured flight prediction data is provided, you MUST format your response into exactly two sections:\n"
        "FROM GIVEN DATA:\n"
        "Summarize the flight prediction: route, travel date, airline, stops, estimated fare (in ₹), 95% prediction "
        "interval range, confidence score, price tier, recommendation, and clearly state any default parameters used. "
        "Explicitly clarify that predictions are statistical machine-learning estimates based on historical data.\n\n"
        "FROM OUTSIDE DATA:\n"
        "Provide concise, relevant travel insights (e.g., typical flight duration, baggage rules, booking tips).\n"
        "If no flight prediction data is provided, answer the user's travel question helpfully and concisely."
    ),
    "data": (
        "You are AeroBot in Internal Data Only mode. "
        "Answer the user's inquiry strictly and exclusively using the provided flight prediction and model data. "
        "Do not include external travel knowledge, airline reviews, or outside assumptions. "
        "Highlight the estimated fare (in ₹), 95% prediction interval, confidence percentage, price tier, "
        "model recommendation, and any parameters/defaults used. "
        "Clearly label all predictions as statistical ML estimates based on historical data. "
        "If no prediction data is available, inform the user to specify a supported route (Bangalore, Chennai, "
        "Delhi, Kolkata, Mumbai) and date."
    ),
    "outside": (
        "You are AeroBot in Outside Knowledge mode, an airline and travel advisor. "
        "Answer the user's query using general travel and airline knowledge (such as luggage rules, airline comparison, "
        "airport guidance, and travel planning). "
        "Do not cite or fabricate internal machine-learning prediction model metrics. "
        "Keep answers concise, accurate, and travel-focused."
    ),
}


def sanitize_input(message: str) -> str:
    """
    Strips legacy frontend instruction wrappers or prompt injection attempts.
    """
    clean = message.strip()
    legacy_prefixes = [
        r"^FORMAT YOUR ANSWER INTO EXACTLY TWO SECTIONS\..*?Question:\s*",
        r"^Answer this question ONLY using the provided flight prediction data\..*?Question:\s*",
        r"^Answer this question ONLY using outside knowledge.*?\..*?Question:\s*",
    ]
    for pat in legacy_prefixes:
        clean = re.sub(pat, "", clean, flags=re.IGNORECASE | re.DOTALL).strip()
    return clean


def parse_date_input(msg: str) -> Tuple[Optional[datetime.date], Optional[str]]:
    """
    Extracts and validates travel dates:
    - Relative keywords: today, tomorrow, day after tomorrow, next week, in X days.
    - Explicit formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, Month DD (YYYY), DD Month (YYYY).
    Returns (parsed_date, error_message).
    """
    today = datetime.date.today()
    msg_low = msg.lower()

    # 1. Relative keyword matching
    if re.search(r"\btoday\b", msg_low):
        return today, None
    if re.search(r"\bday after tomorrow\b", msg_low):
        return today + datetime.timedelta(days=2), None
    if re.search(r"\btomorrow\b", msg_low):
        return today + datetime.timedelta(days=1), None
    if re.search(r"\bnext week\b", msg_low):
        return today + datetime.timedelta(days=7), None

    in_days_match = re.search(r"\bin\s+(\d{1,3})\s+days?\b", msg_low)
    if in_days_match:
        days = int(in_days_match.group(1))
        return today + datetime.timedelta(days=days), None

    # 2. ISO format: YYYY-MM-DD
    iso_match = re.search(r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b", msg)
    if iso_match:
        try:
            year, month, day = map(int, iso_match.groups())
            target_date = datetime.date(year, month, day)
            if target_date < today:
                return None, f"The travel date ({target_date.strftime('%Y-%m-%d')}) is in the past. Please specify a current or future travel date."
            return target_date, None
        except ValueError:
            return None, "The specified date is invalid. Please check the calendar day and month."

    # 3. DD/MM/YYYY or DD-MM-YYYY
    slash_match = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", msg)
    if slash_match:
        try:
            day, month, year = map(int, slash_match.groups())
            target_date = datetime.date(year, month, day)
            if target_date < today:
                return None, f"The travel date ({target_date.strftime('%Y-%m-%d')}) is in the past. Please specify a current or future travel date."
            return target_date, None
        except ValueError:
            return None, "The specified date is invalid. Please check the calendar day and month."

    # 4. Textual month format: "20 Nov 2026", "20 November", "Nov 20", "November 20 2026"
    month_names_pattern = "|".join(MONTH_MAP.keys())
    m_match1 = re.search(
        rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+({month_names_pattern})(?:\s+(\d{{4}}))?\b",
        msg_low,
    )
    if m_match1:
        try:
            day = int(m_match1.group(1))
            month = MONTH_MAP[m_match1.group(2)]
            year = int(m_match1.group(3)) if m_match1.group(3) else today.year
            target_date = datetime.date(year, month, day)
            if not m_match1.group(3) and target_date < today:
                target_date = datetime.date(year + 1, month, day)
            if target_date < today:
                return None, f"The travel date ({target_date.strftime('%Y-%m-%d')}) is in the past. Please specify a current or future travel date."
            return target_date, None
        except ValueError:
            return None, "The specified date is invalid. Please check the calendar day and month."

    m_match2 = re.search(
        rf"\b({month_names_pattern})\s+(\d{{1,2}})(?:st|nd|rd|th)?(?:\s+(\d{{4}}))?\b",
        msg_low,
    )
    if m_match2:
        try:
            month = MONTH_MAP[m_match2.group(1)]
            day = int(m_match2.group(2))
            year = int(m_match2.group(3)) if m_match2.group(3) else today.year
            target_date = datetime.date(year, month, day)
            if not m_match2.group(3) and target_date < today:
                target_date = datetime.date(year + 1, month, day)
            if target_date < today:
                return None, f"The travel date ({target_date.strftime('%Y-%m-%d')}) is in the past. Please specify a current or future travel date."
            return target_date, None
        except ValueError:
            return None, "The specified date is invalid. Please check the calendar day and month."

    return None, None


def extract_route_cities(message: str) -> Tuple[Optional[str], Optional[str], str]:
    """
    Extracts origin and destination cities and returns (source, destination, status).
    Status values: 'VALID', 'SAME_CITY', 'UNSUPPORTED', 'MISSING_DEST', 'MISSING_SRC', 'NONE'
    """
    msg_low = message.lower()

    # Pattern: from X to Y
    m_from_to = re.search(r"\bfrom\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)", msg_low)
    # Pattern: to Y from X
    m_to_from = re.search(r"\bto\s+([a-zA-Z\s]+?)\s+from\s+([a-zA-Z\s]+)", msg_low)
    # Pattern: between X and Y
    m_between = re.search(r"\bbetween\s+([a-zA-Z\s]+?)\s+and\s+([a-zA-Z\s]+)", msg_low)
    # Pattern: X to Y or X - Y or X -> Y
    m_direct = re.search(r"\b([a-zA-Z\s]+?)\s+(?:to|-|->)\s+([a-zA-Z\s]+)", msg_low)

    candidate_pair = None
    if m_from_to:
        candidate_pair = (m_from_to.group(1).strip(), m_from_to.group(2).strip())
    elif m_to_from:
        candidate_pair = (m_to_from.group(2).strip(), m_to_from.group(1).strip())
    elif m_between:
        candidate_pair = (m_between.group(1).strip(), m_between.group(2).strip())
    elif m_direct:
        candidate_pair = (m_direct.group(1).strip(), m_direct.group(2).strip())

    src, dest = None, None

    if candidate_pair:
        raw_src, raw_dest = candidate_pair
        # Find matching known cities inside raw fragments
        for key, val in ALL_KNOWN_CITIES.items():
            if re.search(rf"\b{re.escape(key)}\b", raw_src):
                src = val
                break
        for key, val in ALL_KNOWN_CITIES.items():
            if re.search(rf"\b{re.escape(key)}\b", raw_dest):
                dest = val
                break

    # Fallback: scan for any occurrence of known cities in message order
    if not src or not dest:
        found_in_order = []
        words = re.findall(r"[a-zA-Z]+(?:\s+[a-zA-Z]+)?", msg_low)
        for key, val in ALL_KNOWN_CITIES.items():
            pattern = rf"\b{re.escape(key)}\b"
            for m in re.finditer(pattern, msg_low):
                found_in_order.append((m.start(), val))
        found_in_order.sort(key=lambda x: x[0])

        unique_cities = []
        for _, c in found_in_order:
            if not unique_cities or unique_cities[-1] != c:
                unique_cities.append(c)

        if len(unique_cities) >= 2:
            src, dest = unique_cities[0], unique_cities[1]
        elif len(unique_cities) == 1:
            if re.search(rf"\bto\s+{re.escape(unique_cities[0].lower())}\b", msg_low):
                return None, unique_cities[0], "MISSING_SRC"
            if re.search(rf"\bfrom\s+{re.escape(unique_cities[0].lower())}\b", msg_low):
                return unique_cities[0], None, "MISSING_DEST"

    if not src and not dest:
        return None, None, "NONE"
    if src and not dest:
        return src, None, "MISSING_DEST"
    if not src and dest:
        return None, dest, "MISSING_SRC"

    # Both found
    if src.lower() == dest.lower():
        return src, dest, "SAME_CITY"

    if src not in SUPPORTED_SOURCES or dest not in SUPPORTED_DESTINATIONS:
        return src, dest, "UNSUPPORTED"

    return src, dest, "VALID"


def extract_flight_parameters(message: str) -> Dict[str, Any]:
    """
    Extracts optional flight attributes (airline, stops, cabin, departure hour)
    and flags whether each was user-specified or defaulted.
    """
    msg_low = message.lower()

    # Airline
    airline = "IndiGo"
    airline_specified = False
    for a in SUPPORTED_AIRLINES:
        if re.search(rf"\b{re.escape(a.lower())}\b", msg_low):
            airline = a
            airline_specified = True
            break

    # Stops
    stops = 0
    stops_specified = False
    if re.search(r"\b(?:non-?stop|direct|0\s*stops?|zero\s*stops?)\b", msg_low):
        stops = 0
        stops_specified = True
    elif re.search(r"\b(?:1\s*stops?|one\s*stop|single\s*stop)\b", msg_low):
        stops = 1
        stops_specified = True
    elif re.search(r"\b(?:2\s*stops?|two\s*stops?)\b", msg_low):
        stops = 2
        stops_specified = True

    # Cabin
    cabin = "Economy"
    cabin_specified = False
    if re.search(r"\bbusiness(?:\s*class)?\b", msg_low):
        cabin = "Business"
        cabin_specified = True
    elif re.search(r"\beconomy(?:\s*class)?\b", msg_low):
        cabin = "Economy"
        cabin_specified = True

    # Departure Hour
    departure_hour = 8
    departure_specified = False
    if re.search(r"\bmorning\b", msg_low):
        departure_hour = 8
        departure_specified = True
    elif re.search(r"\bafternoon\b", msg_low):
        departure_hour = 14
        departure_specified = True
    elif re.search(r"\bevening\b", msg_low):
        departure_hour = 18
        departure_specified = True
    elif re.search(r"\bnight\b", msg_low):
        departure_hour = 21
        departure_specified = True
    else:
        hour_match = re.search(r"\b(\d{1,2})\s*(am|pm)\b", msg_low)
        if hour_match:
            h = int(hour_match.group(1))
            period = hour_match.group(2)
            if period == "pm" and h != 12:
                h += 12
            elif period == "am" and h == 12:
                h = 0
            if 0 <= h <= 23:
                departure_hour = h
                departure_specified = True

    # Duration default based on stops
    duration_minutes = 120 if stops == 0 else (240 if stops == 1 else 360)

    return {
        "airline": airline,
        "airline_specified": airline_specified,
        "stops": stops,
        "stops_specified": stops_specified,
        "cabin": cabin,
        "cabin_specified": cabin_specified,
        "departure_hour": departure_hour,
        "departure_specified": departure_specified,
        "duration_minutes": duration_minutes,
    }


def call_llm_api(system_prompt: str, user_content: str, model_choice: str) -> Optional[str]:
    """
    Calls Groq LLM API with OpenAI-compatible client, timeout handling,
    and safe fallback without exposing internal exceptions or credentials.
    """
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key or not groq_api_key.strip():
        return None

    if OpenAI is None:
        return None

    try:
        client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_api_key.strip(),
            timeout=8.0,
            max_retries=1,
        )

        model_name = (
            "llama-3.3-70b-versatile"
            if model_choice == "general"
            else "llama-3.1-8b-instant"
        )

        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            max_tokens=600,
            temperature=0.3,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"LLM API call handled gracefully: {e.__class__.__name__}")
        return None


def get_outside_route_context(src: str, dest: str, airline: str) -> str:
    """
    Generates realistic, concise travel information for outside knowledge sections.
    """
    route_key = tuple(sorted([src.lower(), dest.lower()]))
    durations = {
        ("delhi", "mumbai"): "2 hours 10 minutes",
        ("bangalore", "delhi"): "2 hours 45 minutes",
        ("bangalore", "mumbai"): "1 hour 40 minutes",
        ("delhi", "kolkata"): "2 hours 15 minutes",
        ("chennai", "delhi"): "2 hours 50 minutes",
        ("chennai", "mumbai"): "1 hour 55 minutes",
        ("bangalore", "kolkata"): "2 hours 30 minutes",
        ("chennai", "kolkata"): "2 hours 15 minutes",
        ("bangalore", "chennai"): "55 minutes",
        ("kolkata", "mumbai"): "2 hours 45 minutes",
    }
    flight_time = durations.get(route_key, "approximately 2 hours")

    return (
        f"• Non-stop flying time between {src} and {dest} is typically {flight_time}.\n"
        f"• Standard domestic economy baggage allowance for {airline} is 15 kg check-in and 7 kg cabin baggage.\n"
        f"• Direct flights operate daily across major carriers including IndiGo, Air India, and Vistara.\n"
        f"• Booking at least 2–3 weeks in advance typically yields more competitive fares than last-minute reservations."
    )


def format_prediction_fallback(
    src: str,
    dest: str,
    target_date: datetime.date,
    days_left: int,
    params: Dict[str, Any],
    price: float,
    price_range: str,
    confidence: float,
    recommendation: str,
    interval: list,
    model_choice: str,
) -> str:
    """
    Formats prediction results into clear, structured markdown when LLM is unavailable.
    """
    formatted_price = f"{int(round(price)):,}"
    low_price = f"{int(round(interval[0])):,}"
    high_price = f"{int(round(interval[1])):,}"
    date_str = target_date.strftime("%B %d, %Y")
    days_note = "today" if days_left == 0 else (f"in {days_left} days" if days_left > 1 else "tomorrow")

    airline_label = params["airline"] + (" (default benchmark)" if not params["airline_specified"] else "")
    stops_label = (
        "Non-stop (0 stops)" if params["stops"] == 0 else f"{params['stops']} stop(s)"
    ) + (" (default)" if not params["stops_specified"] else "")
    cabin_label = params["cabin"] + (" (default)" if not params["cabin_specified"] else "")
    dep_label = f"~{params['departure_hour']:02d}:00" + (" (default)" if not params["departure_specified"] else "")

    given_data_section = (
        f"✈️ **Flight Route:** {src} to {dest}\n"
        f"• **Travel Date:** {date_str} ({days_note})\n"
        f"• **Operating Airline:** {airline_label}\n"
        f"• **Flight Parameters:** {stops_label} | Cabin: {cabin_label} | Departure: {dep_label}\n"
        f"• **Estimated Fare:** ₹{formatted_price} (Statistical estimate)\n"
        f"• **95% Prediction Interval:** ₹{low_price} – ₹{high_price}\n"
        f"• **Model Confidence:** {confidence}%\n"
        f"• **Fare Tier:** {price_range}\n"
        f"• **Recommendation:** {recommendation}\n\n"
        f"*Note: Predictions are statistical machine-learning estimates based on historical flight data, "
        f"not real-time airline reservation quotes.*"
    )

    outside_data_section = get_outside_route_context(src, dest, params["airline"])

    if model_choice == "general":
        return f"FROM GIVEN DATA:\n{given_data_section}\n\nFROM OUTSIDE DATA:\n{outside_data_section}"
    elif model_choice == "data":
        return given_data_section
    else:  # outside
        return outside_data_section


def fallback_general_qa(message: str, model_choice: str = "general") -> str:
    """
    Provides clear, accurate travel assistance when Groq LLM is unavailable.
    """
    msg = message.lower()

    if any(g in msg for g in ["hello", "hi", "hey", "greetings", "good morning", "good evening"]):
        return (
            "Hello! I am AeroBot, your flight price prediction and travel assistant. "
            "Ask me to forecast flight prices (e.g., 'Flight from Delhi to Mumbai tomorrow') "
            "or inquire about airline baggage rules and travel tips."
        )

    if any(q in msg for q in ["who are you", "your name", "what can you do"]):
        return (
            "I am AeroBot, an intelligent flight price predictor. I forecast airfares between "
            "major Indian hubs (Bangalore, Chennai, Delhi, Kolkata, Mumbai) using historical machine learning models, "
            "and provide statistical prediction intervals, confidence ratings, and travel tips."
        )

    if any(b in msg for b in ["baggage", "luggage"]):
        return (
            "Standard domestic baggage allowances in India:\n"
            "• **IndiGo, SpiceJet, Air India (Economy):** 15 kg check-in baggage and 7 kg (1 piece) cabin baggage.\n"
            "• **Vistara (Economy):** 15 kg check-in (Standard/Flexi) and 7 kg cabin baggage.\n"
            "• **Business Class:** Usually 25–35 kg check-in baggage and up to 10–12 kg cabin baggage."
        )

    if any(b in msg for b in ["when to book", "cheapest time", "booking tip", "best time to book"]):
        return (
            "Booking Insights:\n"
            "• Booking 2–4 weeks in advance generally offers the best balance of availability and fare.\n"
            "• Mid-week departures (Tuesday and Wednesday) typically feature lower fares than Friday or Sunday evenings.\n"
            "• Early morning (before 7:00 AM) and late evening flights are often more economical than prime business hours."
        )

    if "supported" in msg or "cities" in msg or "routes" in msg:
        return (
            "Supported Airport Hubs:\n"
            "• Bangalore (BLR)\n"
            "• Chennai (MAA)\n"
            "• Delhi (DEL)\n"
            "• Kolkata (CCU)\n"
            "• Mumbai (BOM)\n\n"
            "Supported Airlines: Air India, IndiGo, Jet Airways, SpiceJet, Vistara."
        )

    return (
        "I'm here to assist with flight price predictions and travel planning! "
        "Please specify your departure and destination cities along with your travel date "
        "(e.g., 'Predict flight from Delhi to Mumbai tomorrow on Vistara'). "
        "Supported cities: Bangalore, Chennai, Delhi, Kolkata, and Mumbai."
    )


def get_chat_response(message: str, model_choice: str = "general") -> str:
    """
    Main entry point for chatbot responses.
    Validates modes, handles routes, date parsing, ML predictions, and LLM orchestration.
    """
    # 1. Mode Validation
    if model_choice not in SUPPORTED_CHAT_MODES:
        raise ValueError(
            f"Invalid chatbot mode '{model_choice}'. Allowed modes: {', '.join(SUPPORTED_CHAT_MODES)}"
        )

    # 2. Sanitize user input (reject frontend instruction tampering)
    clean_message = sanitize_input(message)
    if not clean_message:
        return "Please ask a question or specify a flight route to get started."

    # 3. Detect flight prediction intent & extract route
    src, dest, route_status = extract_route_cities(clean_message)

    if route_status == "SAME_CITY":
        return f"Source and destination cannot be identical ('{src}'). Please choose two different cities."

    if route_status == "UNSUPPORTED":
        return (
            f"I noticed you requested a route between {src} and {dest}. "
            f"Currently, our flight prediction model supports flights between: "
            f"{', '.join(SUPPORTED_SOURCES)}. Routes to or from other destinations are not supported yet."
        )

    if route_status == "MISSING_DEST":
        return (
            f"I see you want to fly from {src}, but I need your destination city. "
            f"Supported destinations are: {', '.join(SUPPORTED_DESTINATIONS)}."
        )

    if route_status == "MISSING_SRC":
        return (
            f"I see you want to fly to {dest}, but I need your departure city. "
            f"Supported departure cities are: {', '.join(SUPPORTED_SOURCES)}."
        )

    # If route is valid
    if route_status == "VALID":
        # Parse date
        target_date, date_error = parse_date_input(clean_message)

        if date_error:
            return date_error

        if not target_date:
            return (
                f"I found the route from {src} to {dest}! "
                f"Please specify your travel date (e.g., 'today', 'tomorrow', 'next week', or 'YYYY-MM-DD') "
                f"so I can provide an accurate fare prediction."
            )

        # Extract optional parameters
        params = extract_flight_parameters(clean_message)
        today = datetime.date.today()
        days_left = max(0, (target_date - today).days)

        # In 'outside' mode, do not run internal model prediction
        if model_choice == "outside":
            system_prompt = SYSTEM_PROMPTS["outside"]
            user_content = (
                f"User asks about flights from {src} to {dest} on {target_date.strftime('%Y-%m-%d')}.\n"
                f"Provide helpful travel advice and airline options without quoting ML prediction metrics."
            )
            llm_resp = call_llm_api(system_prompt, user_content, model_choice)
            if llm_resp:
                return llm_resp
            return get_outside_route_context(src, dest, params["airline"])

        # Run model prediction for 'general' and 'data' modes
        payload = {
            "source": src,
            "destination": dest,
            "airline": params["airline"],
            "total_stops": params["stops"],
            "duration_minutes": params["duration_minutes"],
            "departure_hour": params["departure_hour"],
            "day_of_week": target_date.weekday(),
            "month": target_date.month,
            "journey_day": target_date.day,
            "is_weekend": 1 if target_date.weekday() in [5, 6] else 0,
            "days_left": days_left,
            "date": target_date.strftime("%Y-%m-%d"),
            "cabin": params["cabin"],
            "passengers": "1",
        }

        try:
            import sys as _sys
            _server_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if _server_root not in _sys.path:
                _sys.path.insert(0, _server_root)
            from utils.predict import predict_price

            price, recommendation, confidence, price_range, metrics = predict_price(payload)
            interval = metrics.get("prediction_interval_95", [price * 0.85, price * 1.15])

            prediction_summary = {
                "source": src,
                "destination": dest,
                "travel_date": target_date.strftime("%Y-%m-%d"),
                "days_until_flight": days_left,
                "airline": params["airline"],
                "airline_is_default": not params["airline_specified"],
                "stops": params["stops"],
                "stops_is_default": not params["stops_specified"],
                "cabin": params["cabin"],
                "cabin_is_default": not params["cabin_specified"],
                "departure_hour": params["departure_hour"],
                "departure_is_default": not params["departure_specified"],
                "predicted_price_inr": round(price, 2),
                "price_range_tier": price_range,
                "model_confidence_percent": confidence,
                "recommendation": recommendation,
                "prediction_interval_95_inr": [round(interval[0], 2), round(interval[1], 2)],
                "disclaimer": "Statistical machine-learning estimate based on historical data.",
            }

            # Attempt LLM call with structured context
            system_prompt = SYSTEM_PROMPTS[model_choice]
            llm_user_content = (
                f"User Query: {clean_message}\n\n"
                f"Structured Prediction Data:\n"
                f"{json.dumps(prediction_summary, indent=2)}\n\n"
                f"Formulate your response strictly following your system prompt."
            )

            llm_resp = call_llm_api(system_prompt, llm_user_content, model_choice)
            if llm_resp:
                return llm_resp

            # Fallback formatting when LLM is unavailable
            return format_prediction_fallback(
                src=src,
                dest=dest,
                target_date=target_date,
                days_left=days_left,
                params=params,
                price=price,
                price_range=price_range,
                confidence=confidence,
                recommendation=recommendation,
                interval=interval,
                model_choice=model_choice,
            )

        except Exception as e:
            print(f"Prediction engine error handled: {e.__class__.__name__}")
            return (
                "An unexpected issue occurred while calculating the flight prediction. "
                "Please verify your route and try again."
            )

    # 4. If query does not contain a specific route, handle with LLM or General QA fallback
    system_prompt = SYSTEM_PROMPTS[model_choice]
    llm_resp = call_llm_api(system_prompt, clean_message, model_choice)
    if llm_resp:
        return llm_resp

    return fallback_general_qa(clean_message, model_choice)
