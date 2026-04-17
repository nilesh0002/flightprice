import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import random
from datetime import datetime, timedelta

print("Generating synthetic dataset...")
np.random.seed(42)
n_samples = 2000

airlines = ['IndiGo', 'Air India', 'Vistara', 'SpiceJet']
sources = ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai']
destinations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']

# Ensure source and destination are not identical
routes = []
for _ in range(n_samples):
    s = np.random.choice(sources)
    d = np.random.choice(destinations)
    while s == d:
         d = np.random.choice(destinations)
    routes.append((s, d))

start_date = datetime(2024, 1, 1)
dates = [(start_date + timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d') for _ in range(n_samples)]

data = {
    'Airline': np.random.choice(airlines, n_samples),
    'Source': [r[0] for r in routes],
    'Destination': [r[1] for r in routes],
    'Date': dates,
    'Total_Stops': np.random.choice([0, 1, 2], n_samples),
    'Duration': np.random.randint(120, 800, n_samples)
}

df = pd.DataFrame(data)

# Preprocessing to match the API logic
df['Day'] = pd.to_datetime(df['Date']).dt.day
df['Month'] = pd.to_datetime(df['Date']).dt.month
df.drop(['Date'], axis=1, inplace=True)

df = pd.get_dummies(df, columns=['Airline', 'Source', 'Destination'], drop_first=True)

# Generate realistic prices based on features roughly
# Base fare + Stops cost + Duration cost + Noise
df['Price'] = 3000 + df['Total_Stops']*1500 + df['Duration']*3 + np.random.normal(0, 800, n_samples)
df['Price'] = np.where(df['Price'] < 2000, 2000, df['Price'])

X = df.drop('Price', axis=1)
y = df['Price']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Random Forest Regressor...")
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"\nModel Evaluation Metrics:")
print(f"MAE: ₹{mae:.2f}")
print(f"RMSE: ₹{rmse:.2f}")
print(f"R²: {r2:.3f}\n")

# Save the model and columns expected
model_data = {
    'model': model,
    'columns': X_train.columns.tolist()
}
joblib.dump(model_data, 'model.pkl')
print("Model strictly saved as 'model.pkl'")
