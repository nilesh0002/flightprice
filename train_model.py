import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import random
from datetime import datetime, timedelta
import os

def generate_and_train():
    print("Generating synthetic dataset (flight_data.csv)...")
    np.random.seed(42)
    n_samples = 1500

    airlines = ['IndiGo', 'Air India', 'Vistara', 'SpiceJet', 'Jet Airways']
    sources = ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai']
    destinations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']

    routes = []
    for _ in range(n_samples):
        s = np.random.choice(sources)
        d = np.random.choice(destinations)
        while s == d:
             d = np.random.choice(destinations)
        routes.append((s, d))

    start_date = datetime(2024, 1, 1)
    dates = [(start_date + timedelta(days=random.randint(0, 365))) for _ in range(n_samples)]

    data = {
        'airline': np.random.choice(airlines, n_samples),
        'source': [r[0] for r in routes],
        'destination': [r[1] for r in routes],
        'total_stops': np.random.choice([0, 1, 2], n_samples),
        'journey_day': [d.day for d in dates],
        'journey_month': [d.month for d in dates],
        'duration_minutes': np.random.randint(60, 800, n_samples)
    }

    df = pd.DataFrame(data)

    # Realistic price = base + stops*1500 + duration*5 + noise
    df['price'] = 3000 + df['total_stops']*1500 + df['duration_minutes']*5 + np.random.normal(0, 500, n_samples)
    df['price'] = np.where(df['price'] < 2000, 2000, df['price']) # Price floor
    
    # Save the required CSV
    df.to_csv('flight_data.csv', index=False)
    print("dataset saved to flight_data.csv")

    df_encoded = pd.get_dummies(df, columns=['airline', 'source', 'destination'], drop_first=True)

    X = df_encoded.drop('price', axis=1)
    y = df_encoded['price']

    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)

    # Save model and feature columns
    model_data = {
        'model': model,
        'columns': X.columns.tolist()
    }
    joblib.dump(model_data, 'model.pkl')
    print("Model saved to model.pkl successfully.")

if __name__ == "__main__":
    generate_and_train()
