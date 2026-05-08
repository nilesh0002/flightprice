import sys
import os

# Add server/ to path so imports like 'from utils.predict' and 'from chatbot.rule_bot' resolve correctly
server_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'server')
sys.path.insert(0, server_dir)

from app import app
