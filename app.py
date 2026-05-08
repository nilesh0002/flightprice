import sys
import os
import importlib.util

# Change working directory to server/ so relative imports
# (utils.predict, chatbot.rule_bot, model.pkl etc.) resolve correctly.
server_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server")
os.chdir(server_dir)
sys.path.insert(0, server_dir)

# Load server/app.py by FILE PATH (not module name) to avoid circular import,
# since this file is also named app.py.
_spec = importlib.util.spec_from_file_location(
    "_server_app", os.path.join(server_dir, "app.py")
)
_module = importlib.util.module_from_spec(_spec)
sys.modules["_server_app"] = _module
_spec.loader.exec_module(_module)

# Re-export as 'app' so uvicorn can find it via "app:app"
app = _module.app
