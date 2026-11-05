import pytest

def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    assert res.json().get("status") == "ok"

def test_categories_endpoint(client):
    res = client.get("/categories")
    assert res.status_code == 200
    data = res.json()
    assert "airlines" in data
    assert "sources" in data
    assert "destinations" in data
    assert "stops" in data
    assert "cabins" in data
    assert "IndiGo" in data["airlines"]
    assert "Delhi" in data["sources"]

def test_metrics_endpoint(client):
    res = client.get("/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "r2" in data
    assert "mae" in data
    assert "rmse" in data
    assert "f1_approx" not in data  # Verified: regression approximation removed
    assert data["r2"] > 0.8

def test_charts_endpoint(client):
    res = client.get("/charts")
    assert res.status_code == 200
    data = res.json()
    assert "price_vs_airline" in data
    assert "price_vs_stops" in data
    assert "duration_vs_price" in data

def test_predict_valid_payload(client):
    payload = {
        "airline": "IndiGo",
        "source": "Delhi",
        "destination": "Mumbai",
        "total_stops": 0,
        "duration_minutes": 130,
        "date": "2026-11-20",
        "cabin": "Economy",
        "passengers": "1"
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_price" in data
    assert data["predicted_price"] > 1000
    assert "confidence" in data
    assert "recommendation" in data
    assert "price_range" in data
    assert "metrics" in data
    assert "prediction_interval_95" in data["metrics"]

def test_predict_rejects_same_source_and_destination(client):
    payload = {
        "airline": "IndiGo",
        "source": "Delhi",
        "destination": "Delhi",
        "total_stops": 0,
        "duration_minutes": 130,
        "date": "2026-11-20"
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 400
    assert "cannot be identical" in res.json().get("detail", "")

def test_predict_rejects_unsupported_airline(client):
    payload = {
        "airline": "UnknownAir",
        "source": "Delhi",
        "destination": "Mumbai",
        "total_stops": 0,
        "duration_minutes": 130,
        "date": "2026-11-20"
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 400
    assert "Unsupported airline" in res.json().get("detail", "")

def test_predict_rejects_invalid_stops(client):
    payload = {
        "airline": "IndiGo",
        "source": "Delhi",
        "destination": "Mumbai",
        "total_stops": 10,  # Max allowed is 4
        "duration_minutes": 130,
        "date": "2026-11-20"
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 422  # Pydantic validation failure

def test_chat_message_validation(client):
    # Message exceeding 500 characters
    long_msg = "A" * 501
    res = client.post("/chat", json={"message": long_msg})
    assert res.status_code == 422
