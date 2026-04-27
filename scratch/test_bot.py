import sys
import os
sys.path.append(os.getcwd())
from chatbot.rule_bot import get_chat_response

response = get_chat_response("i want to mumbai from delhi on date 29/04/2026")
print(response.encode('utf-8').decode(sys.stdout.encoding, errors='replace'))
