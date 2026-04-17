import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from fastapi.testclient import TestClient
from app import app
import os

client = TestClient(app)

print("--- Testing /test route ---")
response = client.get("/test")
print(response.json())
assert response.status_code == 200

print("\n--- Testing /predict route ---")
payload = {
    "source": "Delhi",
    "destination": "Mumbai",
    "date": "2024-05-15",
    "airline": "IndiGo",
    "total_stops": 0,
    "duration_minutes": 120
}
response = client.post("/predict", json=payload)
print(response.json())
assert response.status_code == 200
assert "predicted_price" in response.json()

print("\n--- Testing /chat route (Flight Query) ---")
chat_payload = {"message": "Delhi to Mumbai tomorrow"}
response = client.post("/chat", json=chat_payload)
print(response.json())
assert response.status_code == 200

print("\n--- Testing /chat route (General Query) ---")
chat_payload = {"message": "Hello"}
response = client.post("/chat", json=chat_payload)
print(response.json())
assert response.status_code == 200

print("\nAll tests passed successfully!")
