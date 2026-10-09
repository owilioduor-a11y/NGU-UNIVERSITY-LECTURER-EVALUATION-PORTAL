"""Application configuration and environment-backed settings.

All values are loaded from the repository-root ``.env`` file (see python-dotenv),
falling back to safe development defaults.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Repository root = two levels up from backend-python/config/
BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

DATABASE_DIR = BASE_DIR / "database"
DATABASE_DIR.mkdir(parents=True, exist_ok=True)
FRONTEND_DIR = BASE_DIR / "frontend"


def _resolve_sqlite_uri(uri: str) -> str:
    """Make relative SQLite paths absolute so they resolve from the repo root."""
    prefix = "sqlite:///"
    if uri.startswith(prefix):
        raw_path = uri[len(prefix):]
        if not os.path.isabs(raw_path):
            raw_path = str(BASE_DIR / raw_path)
        return prefix + raw_path.replace("\\", "/")
    return uri


# --- Core -----------------------------------------------------------------
SQLALCHEMY_DATABASE_URI = _resolve_sqlite_uri(
    os.getenv("DATABASE_URL", "sqlite:///database/app.db")
)
SQLALCHEMY_TRACK_MODIFICATIONS = False

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret")

FLASK_ENV = os.getenv("FLASK_ENV", "development")
DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "5000"))

_raw_origins = os.getenv("CORS_ORIGINS", "*").strip()
CORS_ORIGINS = (
    "*"
    if _raw_origins == "*"
    else [origin.strip() for origin in _raw_origins.split(",") if origin.strip()]
)

# --- Domain seed data -----------------------------------------------------
DEPARTMENTS = ["Computing & AI", "Engineering", "Leadership"]

UNITS = [
    "Intro to Computing",
    "Discrete Math",
    "Software Design",
    "Data Structures",
    "Network Security",
    "AI Principles",
]

SEED_LECTURERS = [
    {"name": "Dr. Matin", "department": "Computing & AI"},
    {"name": "Prof. Kwesi", "department": "Computing & AI"},
    {"name": "Dr. Owili", "department": "Engineering"},
    {"name": "Prof. Njeri", "department": "Engineering"},
    {"name": "Dr. Rodriguez", "department": "Leadership"},
    {"name": "Dr. Sang", "department": "Computing & AI"},
    {"name": "Prof. Okello", "department": "Engineering"},
    {"name": "Dr. Amina", "department": "Leadership"},
    {"name": "Dr. Mutua", "department": "Computing & AI"},
    {"name": "Prof. Zhao", "department": "Engineering"},
]
