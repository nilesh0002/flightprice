import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, _chat_request_history

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(autouse=True)
def reset_rate_limit():
    _chat_request_history.clear()
    yield
    _chat_request_history.clear()
