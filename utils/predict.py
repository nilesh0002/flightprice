import joblib
import os
from utils.preprocess import preprocess_input

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

# Initialize immediately (NO auto-training)
load_model()

def predict_price(flight_data: dict):
    global model_data
    if not model_data:
        raise RuntimeError("Model not available")
            
    try:
        model = model_data['model']
        columns = model_data['columns']
        
        df = preprocess_input(flight_data, columns)
        price = model.predict(df)[0]
        
        average_price = 3000 + (flight_data['total_stops'] * 1500) + (flight_data['duration_minutes'] * 5)
        if price <= average_price + 200:
            recommendation = "Good time to book! The price is below or near average."
        else:
            recommendation = "Wait for better price. Current price is quite high."
            
        return price, recommendation
    except Exception as e:
        raise RuntimeError(f"Prediction error: {str(e)}")
