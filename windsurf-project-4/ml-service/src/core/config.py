"""
Configuration settings for ML Service
"""

from pydantic import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Project Information
    PROJECT_NAME: str = "Face Recognition ML Service"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = "Machine Learning service for face detection and recognition"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres123@localhost:5432/face_recognition"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # ML Configuration
    MODEL_PATH: str = "./models"
    FACE_DETECTION_MODEL: str = "haarcascade_frontalface_default.xml"
    FACE_RECOGNITION_MODEL: str = "face_recognition_model.h5"
    EMBEDDING_MODEL: str = "facenet_model.h5"
    
    # Face Detection Settings
    FACE_DETECTION_CONFIDENCE_THRESHOLD: float = 0.7
    MIN_FACE_SIZE: int = 48
    MAX_FACE_SIZE: int = 512
    
    # Face Recognition Settings
    FACE_RECOGNITION_THRESHOLD: float = 0.6
    EMBEDDING_DIMENSION: int = 512
    
    # Image Processing
    MAX_IMAGE_SIZE: int = 4096
    JPEG_QUALITY: int = 85
    SUPPORTED_FORMATS: List[str] = ["JPEG", "PNG", "WEBP"]
    
    # Performance
    MAX_CONCURRENT_PROCESSING: int = 4
    BATCH_SIZE: int = 32
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Monitoring
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 8002
    
    # Cache
    CACHE_TTL: int = 3600  # 1 hour
    EMBEDDING_CACHE_SIZE: int = 10000
    
    # Security
    SECRET_KEY: str = "ml-service-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    
    # External Services
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET_NAME: str = "face-recognition"
    
    # Celery (for async processing)
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
