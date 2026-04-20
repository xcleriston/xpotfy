import secrets
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, EmailStr, HttpUrl, field_validator, ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    SERVER_NAME: str = "FireHorseAPI"
    SERVER_HOST: AnyHttpUrl = "http://localhost:8000"
    # BACKEND_CORS_ORIGINS is a JSON-formatted list of origins
    # e.g: '["http://localhost", "http://localhost:4200", "http://localhost:3000"]'
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode='before')
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    PROJECT_NAME: str = "FireHorse"
    
    # Database
    SQLALCHEMY_DATABASE_URI: Optional[str] = "sqlite:///./fire_horse.db"
    
    # Betfair API
    BETFAIR_APP_KEY: str = ""
    BETFAIR_USERNAME: str = ""
    BETFAIR_PASSWORD: str = ""
    BETFAIR_CERTS_PATH: str = "./certs"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # First superuser
    FIRST_SUPERUSER: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "changethis"
    
    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding='utf-8',
        extra='ignore'
    )

settings = Settings()
