import sys
import os

# Add project root to path
sys.path.append(r"c:\Users\niles\OneDrive\Desktop\flightprice")

from chatbot.rule_bot import get_chat_response

with open("scratch_out.txt", "w", encoding="utf-8") as f:
    f.write("1. " + get_chat_response("flight from delhi to mumbai on 12/05/2026") + "\n\n")
    f.write("2. " + get_chat_response("flight from delhi to mumbai on 12/05/2026") + "\n\n")
    f.write("3. " + get_chat_response("price for flight to mumbai on 12/05/2026") + "\n\n")
    f.write("4. " + get_chat_response("price for flight to mumbai on 12/05/2026") + "\n\n")
