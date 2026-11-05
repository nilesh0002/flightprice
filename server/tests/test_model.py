import os
import joblib
import pandas as pd
import numpy as np

def test_model_artifact():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "model.pkl")
    assert os.path.exists(model_path), "model.pkl must exist"

    artifact = joblib.load(model_path)
    assert "model" in artifact
    assert "metrics" in artifact
    assert "supported_categories" in artifact

    metrics = artifact["metrics"]
    assert "r2" in metrics
    assert "mae" in metrics
    assert "rmse" in metrics
    assert "f1_approx" not in metrics  # Ensured Issue #5 is resolved
    assert metrics["r2"] >= 0.85

def test_model_predict_inference():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "model.pkl")
    artifact = joblib.load(model_path)
    model = artifact["model"]

    sample_df = pd.DataFrame([{
        "airline": "Vistara",
        "source": "Delhi",
        "destination": "Mumbai",
        "total_stops": 0,
        "duration_minutes": 130,
        "journey_day": 15,
        "journey_month": 11
    }])

    pred = model.predict(sample_df)
    assert len(pred) == 1
    assert float(pred[0]) > 0
