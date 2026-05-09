from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent

class Settings(BaseSettings):
    DATABASE_URL: str = ""
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str | None = None
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:5176,http://127.0.0.1:5176,https://recipe-frontend-661692832664.us-central1.run.app"

    IMAGE_STORAGE: str = "local"
    UPLOAD_DIR: str = "uploads"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_BUCKET_NAME: str = ""
    AWS_REGION: str = ""
    MAX_IMAGE_SIZE_MB: int = 5
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/webp"

    # Email Settings
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_PORT: int = 587
    MAIL_SERVER: str = ""
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    MAIL_FROM_NAME: str = "RecipeManager"

    model_config = SettingsConfigDict(
        env_file=(str(PROJECT_ROOT / ".env"), str(BACKEND_ROOT / ".env")),
        extra="ignore",
    )

settings = Settings()
