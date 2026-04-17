import joblib
import os
from utils.preprocess import preprocess_input

model_data = None

def load_or_train_model():
    global model_data
    if not os.path.exists('model.pkl'):
        print("Model not found. Triggering auto-training...")
        from train_model import generate_and_train
        generate_and_train()
    
    if not model_data:
        model_data = joblib.load('model.pkl')

# Initialize eagerly at startup
try:
    load_or_train_model()
except Exception as e:
    print(f"Startup model load warning: {e}")

def predict_price(flight_data: dict):
    global model_data
    if not model_data:
        load_or_train_model()
            
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
