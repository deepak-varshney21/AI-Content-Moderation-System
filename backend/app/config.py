"""Application Configuration Module.

Centralizes all configurable settings, threshold limits, model identifiers,
and database connections. All values can be overridden via environment variables.
"""

from pathlib import Path
from typing import Dict, List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
RESOURCES_DIR = BASE_DIR / "resources"


class Settings(BaseSettings):
    """Global Application Settings."""

    # Application metadata
    PROJECT_NAME: str = "AI-Powered Severity-Aware Multi-Label Content Moderation System"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Model Configuration
    MODEL_NAME: str = "oleksiizirka/xlm-roberta-toxicity-classifier"
    FALLBACK_MODEL_NAME: str = "unitary/toxic-bert"
    USE_GPU_IF_AVAILABLE: bool = True
    MAX_SEQUENCE_LENGTH: int = 512
    MAX_COMMENT_LENGTH: int = 2500

    # The 6 Standard Toxicity Classification Labels
    TARGET_LABELS: List[str] = [
        "toxic",
        "severe_toxic",
        "obscene",
        "threat",
        "insult",
        "identity_hate",
    ]

    # Configurable Label Thresholds (Default 0.50)
    DEFAULT_THRESHOLD: float = 0.50
    LABEL_THRESHOLDS: Dict[str, float] = {
        "toxic": 0.50,
        "severe_toxic": 0.45,
        "obscene": 0.50,
        "threat": 0.40,
        "insult": 0.50,
        "identity_hate": 0.40,
    }

    # Severity Threshold Rules
    SEVERITY_WEIGHTS: Dict[str, float] = {
        "toxic": 1.0,
        "severe_toxic": 2.5,
        "obscene": 0.9,
        "threat": 2.8,
        "insult": 1.1,
        "identity_hate": 2.2,
    }

    # Database
    DATABASE_URL: str = "sqlite:///./moderation.db"

    # Resources
    BAD_WORDS_FILE: str = str(RESOURCES_DIR / "bad_words.txt")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
