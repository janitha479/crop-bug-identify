"""Application configuration, loaded from environment / .env."""
import os
from pathlib import Path

from dotenv import load_dotenv

# backend/ directory (parent of app/)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from backend/ if present
load_dotenv(BASE_DIR / ".env")


def _as_bool(value: str, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Config:
    # LLM
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()

    # Auth + database. DATABASE_URL is a PostgreSQL connection string (e.g. from Neon).
    # If unset, the auth/dashboard features are disabled but the rest of the app still runs.
    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-insecure-change-me").strip()
    JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "168"))  # 7 days

    # Model
    MODEL_PATH = BASE_DIR / os.getenv("MODEL_PATH", "model/pest_model.keras")
    CLASS_NAMES_PATH = BASE_DIR / os.getenv("CLASS_NAMES_PATH", "model/class_names.json")
    KB_PATH = BASE_DIR / "knowledge_base" / "pests.json"
    # A prediction is asserted if it clears CONFIDENCE_THRESHOLD outright, OR if it
    # is a clear leader: at least MARGIN_MIN_CONFIDENCE and ahead of the runner-up by
    # at least MARGIN_GAP. The margin rule catches borderline-but-obvious cases (e.g.
    # top 54% vs next 42%) that a flat threshold would wrongly treat as "unsure".
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.55"))
    MARGIN_MIN_CONFIDENCE = float(os.getenv("MARGIN_MIN_CONFIDENCE", "0.45"))
    MARGIN_GAP = float(os.getenv("MARGIN_GAP", "0.10"))

    # News (live agriculture headlines via Google News RSS — keyless)
    NEWS_QUERY = os.getenv(
        "NEWS_QUERY", "Sri Lanka agriculture OR farming OR paddy OR crops"
    )
    NEWS_CACHE_TTL = int(os.getenv("NEWS_CACHE_TTL", "900"))  # seconds
    NEWS_LIMIT = int(os.getenv("NEWS_LIMIT", "12"))

    # Uploads
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8 MB max upload
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "bmp"}

    # Server
    DEBUG = _as_bool(os.getenv("FLASK_DEBUG"), default=False)
    PORT = int(os.getenv("PORT", "5000"))
    CORS_ORIGINS = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if o.strip()
    ]
