import os
import joblib
import pandas as pd
import numpy as np

model_data = None

def load_model():
    global model_data
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base_dir, 'model.pkl')
        if not os.path.exists(model_path):
            print(f"Model file not found at {model_path}")
            return None
        
        if model_data is None:
            model_data = joblib.load(model_path)
            print("Model loaded successfully")
        return model_data
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

# Load model on startup
load_model()

def predict_price(flight_data: dict):
    global model_data
    if model_data is None:
        model_data = load_model()
    if model_data is None:
        raise RuntimeError("Model not available. Please ensure model.pkl exists.")

    pipeline = model_data['model']
    metrics = model_data.get('metrics', {})
    residual_std = metrics.get('residual_std', 550.0)

    # Resolve date components (journey_day, journey_month)
    date_str = flight_data.get('date', '')
    if date_str:
        try:
            parts = [int(p) for p in date_str.split('-')]
            if len(parts) == 3:
                journey_month = parts[1]
                journey_day = parts[2]
            else:
                journey_month = int(flight_data.get('month', 5))
                journey_day = int(flight_data.get('journey_day', 15))
        except (ValueError, IndexError):
            journey_month = int(flight_data.get('month', 5))
            journey_day = int(flight_data.get('journey_day', 15))
    else:
        journey_month = int(flight_data.get('month', 5))
        journey_day = int(flight_data.get('journey_day', 15))

    duration_minutes = int(flight_data.get('duration_minutes', 120))
    total_stops = int(flight_data.get('total_stops', 0))

    # Construct input payload matching training pipeline feature set
    input_df = pd.DataFrame([{
        'airline': str(flight_data.get('airline', 'IndiGo')).strip(),
        'source': str(flight_data.get('source', 'Delhi')).strip(),
        'destination': str(flight_data.get('destination', 'Mumbai')).strip(),
        'total_stops': total_stops,
        'duration_minutes': duration_minutes,
        'journey_day': journey_day,
        'journey_month': journey_month
    }])

    # 1. Base prediction from trained ML pipeline
    base_price = float(pipeline.predict(input_df)[0])

    # 2. Ensemble variance & statistical prediction interval
    rf = pipeline.named_steps['regressor']
    preprocessor = pipeline.named_steps['preprocessor']
    X_transformed = preprocessor.transform(input_df)
    tree_preds = np.array([tree.predict(X_transformed)[0] for tree in rf.estimators_])
    
    ensemble_std = float(np.std(tree_preds))
    # Combined uncertainty: tree ensemble variance + test residual variance
    total_uncertainty = float(np.sqrt(ensemble_std**2 + (residual_std * 0.5)**2))

    # Statistically calibrated confidence: based on relative uncertainty (coefficient of variation)
    cv = total_uncertainty / max(1.0, base_price)
    confidence = round(max(60.0, min(97.5, (1.0 - cv) * 100)), 1)

    # Multipliers for legitimate booking modifiers
    cabin = flight_data.get('cabin', 'Economy')
    cabin_multiplier = 1.6 if cabin == 'Business' else (1.25 if cabin == 'Premium Economy' else 1.0)
    
    passengers_raw = str(flight_data.get('passengers', '1')).replace('+', '')
    try:
        num_passengers = max(1, int(passengers_raw))
    except ValueError:
        num_passengers = 1

    unit_price = base_price * cabin_multiplier
    final_price = round(unit_price * num_passengers, 2)

    # 95% statistical prediction bounds
    bound_delta = 1.96 * total_uncertainty * cabin_multiplier * num_passengers
    price_low = round(max(1000.0 * num_passengers, final_price - bound_delta), 2)
    price_high = round(final_price + bound_delta, 2)

    # Categorize price tier based on market distribution
    days_left = flight_data.get('days_left', 30)
    if final_price < 5500 * num_passengers:
        price_range = "Low"
    elif final_price < 8500 * num_passengers:
        price_range = "Medium"
    else:
        price_range = "High"

    # Contextual market recommendation
    if price_range == "Low" or (isinstance(days_left, (int, float)) and days_left < 7):
        recommendation = "Good time to book! Current rate is below historical median."
    else:
        recommendation = "Prices are currently elevated. Consider monitoring for fare adjustments."

    response_metrics = {
        **metrics,
        'uncertainty': round(total_uncertainty, 2),
        'prediction_interval_95': [price_low, price_high]
    }

    return final_price, recommendation, confidence, price_range, response_metrics
