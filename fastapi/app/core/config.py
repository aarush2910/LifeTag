from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl
from typing import List


class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "LifeTag"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 4
    ALGORITHM:str

    
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DATABASE_URL: AnyUrl

    # Mail Settings
    MAIL_SERVER: str
    MAIL_PORT: int
    MAIL_USERNAME: str | None = None
    MAIL_PASSWORD: str | None = None
    MAIL_FROM_NAME: str | None = "LifeTag Support"
    MAIL_USE_SSL: bool = True
    MAIL_USE_TLS: bool = False

   
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    
    UPLOAD_FOLDER: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 16

   
    model_config = SettingsConfigDict(

        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
