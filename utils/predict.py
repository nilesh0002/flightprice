import joblib
import os
from utils.preprocess import preprocess_input

model_data = None

print("Server started. Initializing prediction engine...")

def load_model():
    global model_data
    if not os.path.exists('model.pkl'):
        print("CRITICAL ERROR: model.pkl not found! Auto-training logic has been removed to preserve server stability. Please train locally and deploy the .pkl file.")
        return
    
    if not model_data:
        try:
            model_data = joblib.load('model.pkl')
            print("Model loaded successfully. Ready for inference.")
        except Exception as e:
            print(f"Error loading model: {e}")

# Initialize eagerly at startup (ensures <5s boot time on Render)
load_model()

def predict_price(flight_data: dict):
    global model_data
    if not model_data:
        raise RuntimeError("Model not available. The model.pkl file is missing from the deployed repository.")
            
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
