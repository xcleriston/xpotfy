"""
Main FastAPI application
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import structlog
import time

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.v1 import auth, photos

# Configure structured logging
logger = structlog.get_logger()

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Face Recognition MVP Backend API",
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

# Add trusted host middleware for production
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]  # Configure with actual domains in production
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
        "request_processed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        process_time=process_time,
    )
    
    return response


# Exception handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    logger.warning(
        "http_exception",
        status_code=exc.status_code,
        detail=exc.detail,
        url=str(request.url),
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.warning(
        "validation_error",
        errors=exc.errors(),
        url=str(request.url),
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "message": "Validation error",
            "errors": exc.errors(),
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(
        "unexpected_error",
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
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Authentication"],
)

app.include_router(
    photos.router,
    prefix=f"{settings.API_V1_STR}/photos",
    tags=["Photos"],
)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
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
    }


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Application startup"""
    logger.info("application_startup", version=settings.VERSION, environment=settings.ENVIRONMENT)
    
    # Initialize database
    await init_db()
    logger.info("database_initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown"""
    logger.info("application_shutdown")
    
    # Close database connections
    await close_db()
    logger.info("database_connections_closed")


# Metrics endpoint for monitoring
@app.get("/metrics")
async def metrics():
    """Basic metrics endpoint"""
    # TODO: Implement Prometheus metrics
    return {
        "status": "ok",
        "metrics": {
            "requests_total": 0,  # TODO: Implement request counting
            "active_users": 0,    # TODO: Implement active user tracking
        },
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
