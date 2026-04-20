"""
Main FastAPI application for ML Service
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
import time

from app.core.config import settings
from app.api.v1 import face_detection, face_recognition

# Configure structured logging
logger = structlog.get_logger()

# Create FastAPI application
app = FastAPI(
    title="Face Recognition ML Service",
    version=settings.VERSION,
    description="Machine Learning service for face detection and recognition",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add request processing time header"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log request
    logger.info(
        "ml_request_processed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        process_time=process_time,
    )
    
    return response

# Exception handlers
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(
        "ml_unexpected_error",
        error=str(exc),
        url=str(request.url),
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "message": "Internal server error",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
    )

# Include API routers
app.include_router(
    face_detection.router,
    prefix=f"{settings.API_V1_STR}/face-detection",
    tags=["Face Detection"],
)

app.include_router(
    face_recognition.router,
    prefix=f"{settings.API_V1_STR}/face-recognition",
    tags=["Face Recognition"],
)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Face Recognition ML Service",
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "ml_models_loaded": True,  # TODO: Check actual model status
    }

# Metrics endpoint for monitoring
@app.get("/metrics")
async def metrics():
    """Basic metrics endpoint"""
    return {
        "status": "ok",
        "metrics": {
            "requests_total": 0,  # TODO: Implement request counting
            "face_detections": 0,  # TODO: Implement detection counting
            "face_recognitions": 0,  # TODO: Implement recognition counting
        },
    }

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
