import sys
import os
sys.path.append(os.getcwd())
from chatbot.rule_bot import get_chat_response

response = get_chat_response("Delhi to Mumbai tomorrow")
print(response)
