import re
from datetime import datetime
from utils.predict import predict_price

def get_chat_response(message: str) -> str:
    msg = message.lower().strip()
    
    if msg in ["hello", "hi", "hey", "greetings"]:
        return "Hello! I am your AI Flight Assistant. How can I help you today?"
        
    if "what day is today" in msg or "current date" in msg or "what is the date" in msg:
        now = datetime.now()
        return f"Today is {now.strftime('%A, %B %d, %Y')}."
        
    if "prime minister of india" in msg:
        return "The Prime Minister of India is Narendra Modi."
        
    if " to " in msg:
        words = msg.split()
        if "to" in words:
            to_idx = words.index("to")
            if to_idx > 0 and to_idx < len(words) - 1:
                source = words[to_idx - 1].capitalize()
                destination = words[to_idx + 1].capitalize()
                
                date = datetime.now().strftime('%Y-%m-%d')
                if "tomorrow" in msg:
                    from datetime import timedelta
                    date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
                
                flight_data = {
                    "source": source,
                    "destination": destination,
                    "date": date,
                    "airline": "IndiGo",
                    "stops": 0,
                    "duration": 150
                }
                
                try:
                    price, rec = predict_price(flight_data)
                    if price > 0:
                        return f"Found flights from {source} to {destination} on {date}. Predicted price is starting at ₹{round(price, 2)}. {rec}"
                    else:
                        return "I see you're looking for flights, but our model is currently not trained. Please run 'train_model.py'."
                except Exception as e:
                    return f"Sorry, I couldn't get a price for that route. Please try using the detailed form above."
    
    if "book tickets" in msg or "book a flight" in msg or "should i book" in msg:
        return "I suggest you enter your exact travel details in the prediction form above to see if it's a good time to book based on our latest price projections."

    return "I'm sorry, I didn't completely understand that. Try asking something like 'Delhi to Mumbai tomorrow' or use the prediction form above!"
