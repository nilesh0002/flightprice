import joblib
from utils.preprocess import preprocess_input

model_data = None
try:
    model_data = joblib.load('model.pkl')
except:
    pass

def predict_price(flight_data: dict):
    global model_data
    if not model_data:
        try:
            model_data = joblib.load('model.pkl')
        except:
            return 0, "Model not trained yet. Please run train_model.py first."
            
    model = model_data['model']
    columns = model_data['columns']
    
    df = preprocess_input(flight_data, columns)
    price = model.predict(df)[0]
    
    # Calculate a simple average threshold based on inputs
    average_price = 3000 + (flight_data['stops'] * 1500) + (flight_data['duration'] * 3)
    if price <= average_price + 200:
        recommendation = "Good time to book! The price is below or near average."
    else:
        recommendation = "Wait for better price. Current price is quite high."
        
    return price, recommendation
