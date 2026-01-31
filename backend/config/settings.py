import os
from typing import Optional


class Settings:
    TEMP_DIR: str = os.getenv("TEMP_DIR", "temp")

    CLEANUP_ENABLED: bool = os.getenv("CLEANUP_ENABLED", "true").lower() == "true"
    CLEANUP_MAX_AGE_HOURS: int = int(os.getenv("CLEANUP_MAX_AGE_HOURS", "1"))
    CLEANUP_INTERVAL_MINUTES: int = int(os.getenv("CLEANUP_INTERVAL_MINUTES", "30"))

    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")

    SECRET_KEY: Optional[str] = os.getenv("SECRET_KEY")
    MONGODB_URI: Optional[str] = os.getenv("MONGODB_URI")


settings = Settings()
