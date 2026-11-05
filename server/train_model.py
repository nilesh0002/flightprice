import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

try:
    from constants import SUPPORTED_AIRLINES, SUPPORTED_SOURCES, SUPPORTED_DESTINATIONS, SUPPORTED_STOPS
except ImportError:
    from server.constants import SUPPORTED_AIRLINES, SUPPORTED_SOURCES, SUPPORTED_DESTINATIONS, SUPPORTED_STOPS

def train_and_evaluate():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, 'flight_data.csv')
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Training dataset not found at {data_path}")
        
    df = pd.read_csv(data_path)
    print(f"Loaded dataset with shape {df.shape}")

    # Standardize column names to lowercase
    df.columns = [col.strip().lower() for col in df.columns]

    categorical_features = ['airline', 'source', 'destination']
    numeric_features = ['total_stops', 'duration_minutes', 'journey_day', 'journey_month']
    feature_cols = categorical_features + numeric_features

    X = df[feature_cols]
    y = df['price']

    # Reproducible 80/20 train/test split (held-out validation)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
            ('num', 'passthrough', numeric_features)
        ]
    )

    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])

    print("Training Random Forest Regressor on training split...")
    pipeline.fit(X_train, y_train)

    # Evaluate strictly on held-out test split
    y_pred_test = pipeline.predict(X_test)
    r2 = r2_score(y_test, y_pred_test)
    mae = mean_absolute_error(y_test, y_pred_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    residuals = y_test - y_pred_test
    residual_std = float(np.std(residuals))

    print(f"Held-out Test Metrics:")
    print(f"  R2 Score : {r2:.4f}")
    print(f"  MAE      : Rs. {mae:.2f}")
    print(f"  RMSE     : Rs. {rmse:.2f}")
    print(f"  Res. Std : Rs. {residual_std:.2f}")

    # Compute empirical chart metrics from actual dataset
    price_by_airline = df.groupby('airline')['price'].mean().round(2).to_dict()
    price_by_stops = df.groupby('total_stops')['price'].mean().round(2).to_dict()

    # Duration vs price bins (e.g. 1-2h, 2-4h, 4-6h, 6h+)
    df['duration_bin'] = pd.cut(
        df['duration_minutes'], 
        bins=[0, 120, 240, 360, 1000], 
        labels=['< 2h', '2-4h', '4-6h', '6h+']
    )
    duration_chart = [
        {"x": int(row['duration_minutes']), "y": round(float(row['price']), 2)}
        for _, row in df.sample(min(50, len(df)), random_state=42).iterrows()
    ]

    charts_data = {
        "price_vs_airline": {
            "labels": list(price_by_airline.keys()),
            "data": list(price_by_airline.values())
        },
        "price_vs_stops": {
            "labels": [f"{k} Stop{'s' if k != 1 else ''}" for k in price_by_stops.keys()],
            "data": list(price_by_stops.values())
        },
        "duration_vs_price": duration_chart
    }

    model_artifact = {
        'model': pipeline,
        'features': feature_cols,
        'categorical_features': categorical_features,
        'numeric_features': numeric_features,
        'metrics': {
            'r2': round(float(r2), 4),
            'mae': round(float(mae), 2),
            'rmse': round(float(rmse), 2),
            'residual_std': round(residual_std, 2),
            'train_samples': len(X_train),
            'test_samples': len(X_test),
            'method': 'Random Forest Regressor',
            'validation': 'Held-out test set (80/20 split)'
        },
        'charts': charts_data,
        'supported_categories': {
            'airlines': SUPPORTED_AIRLINES,
            'sources': SUPPORTED_SOURCES,
            'destinations': SUPPORTED_DESTINATIONS,
            'stops': SUPPORTED_STOPS
        }
    }

    model_output_path = os.path.join(base_dir, 'model.pkl')
    joblib.dump(model_artifact, model_output_path)
    print(f"Model saved successfully to {model_output_path}")

if __name__ == "__main__":
    train_and_evaluate()
