import os
from pathlib import Path
from dotenv import load_dotenv

# Define directory paths
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load environment variables from backend or root
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(BACKEND_DIR / ".env")
load_dotenv()

DATA_DIR = PROJECT_ROOT / "data" if (PROJECT_ROOT / "data").exists() else BACKEND_DIR / "data"
SESSIONS_DIR = DATA_DIR / "sessions"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True, parents=True)
SESSIONS_DIR.mkdir(exist_ok=True, parents=True)

# Settings
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", 30))
