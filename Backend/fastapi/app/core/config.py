from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl
from typing import List


class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "LifeTag"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    
    DB_USER: str | None = None
    DB_PASSWORD: str | None = None
    DB_HOST: str | None = None
    DB_PORT: int | None = None
    DB_NAME: str | None = None
    DATABASE_URL: AnyUrl

    # Redis (Upstash) Settings
    REDIS_URL: str | None = None
    REDIS_ENABLED: bool = True
    REDIS_CACHE_TTL: int = 300
    REDIS_MAX_CONNECTIONS: int = 5

    # Mail Settings
    MAIL_SERVER: str | None = None
    MAIL_PORT: int | None = None
    MAIL_USERNAME: str | None = None
    MAIL_PASSWORD: str | None = None
    MAIL_FROM: str | None = None
    MAIL_FROM_NAME: str | None = "LifeTag Support"
    MAIL_USE_SSL: bool = True
    MAIL_USE_TLS: bool = False

   
    FRONTEND_URL: str = "https://lifetag-frontend.onrender.com"
    CORS_ORIGINS: str = "https://lifetag-frontend.onrender.com,https://life-tag.vercel.app,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5173"

    
    UPLOAD_FOLDER: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 16

   
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
