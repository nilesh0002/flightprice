import joblib
import os
import pandas as pd
import numpy as np

model_data = None

print("Server started")

def load_model():
    global model_data
    try:
        if not os.path.exists('model.pkl'):
            print("CRITICAL ERROR: model.pkl not found!")
            return
        
        if not model_data:
            model_data = joblib.load('model.pkl')
            print("Model loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")

# Initialize immediately (NO auto-training block)
load_model()

def predict_price(flight_data: dict):
    global model_data
    if not model_data:
        raise RuntimeError("Model not available")

    try:
        model = model_data['model']

        # Consistent preprocessing (if needed, call preprocess_input here)
        # If your model expects preprocessed input, uncomment below:
        # from utils.preprocess import preprocess_input
        # payload = preprocess_input(flight_data, model_data['columns'])

        payload = pd.DataFrame([{
            'Airline': flight_data['airline'],
            'Source': flight_data['source'],
            'Destination': flight_data['destination'],
            'Total_Stops': flight_data['total_stops'],
            'Duration_minutes': flight_data['duration_minutes'],
            'departure_hour': flight_data['departure_hour'],
            'day_of_week': flight_data['day_of_week'],
            'month': flight_data['month'],
            'is_weekend': flight_data['is_weekend'],
            'days_left': flight_data['days_left']
        }])

        # Full inference pass via SciKit pipeline natively handling categorical encoding internally
        price = model.predict(payload)[0]

        # Confidence score: based on estimator variance
        rf = model.named_steps['regressor']
        X_transformed = model.named_steps['preprocessor'].transform(payload)
        preds = [tree.predict(X_transformed)[0] for tree in rf.estimators_]
        std_dev = np.std(preds)
        confidence = max(0, min(100, 100 - (std_dev / price * 200)))

        # Price range logic
        average_price = 3000 + (flight_data['total_stops'] * 1500) + (flight_data['duration_minutes'] * 5)

        if price < 5000:
            price_range = "Low"
        elif price < 10000:
            price_range = "Medium"
        else:
            price_range = "High"

        if price <= average_price + 200 or flight_data['days_left'] < 5:
            recommendation = "Good time to book! 🚀 Avoid surge pricing."
        else:
            recommendation = "Prices may increase. Wait for dynamic pricing drops."
            
        return price, recommendation, round(confidence, 1), price_range
    except Exception as e:
        raise RuntimeError(f"Prediction error: {str(e)}")
