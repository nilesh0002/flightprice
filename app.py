import sys
import os

# Change working directory to server/ so relative imports
# (utils.predict, chatbot.rule_bot, model.pkl etc.) resolve correctly.
server_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server")
os.chdir(server_dir)
sys.path.insert(0, server_dir)

# Re-export the FastAPI app so uvicorn can find it via "app:app"
from app import app  # noqa: E402
