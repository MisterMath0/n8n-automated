from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import structlog
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .core.config import settings
from .core.logging import setup_logging
from .core.dependencies import validate_api_keys
from .routers import workflows, messages


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger = structlog.get_logger()
    
    logger.info("Starting N8N AI Workflow Generator API", version=settings.app_version)
    
    try:
        validate_api_keys()
        logger.info("API key validation passed")
    except Exception as e:
        logger.warning("API key validation failed", error=str(e))
    
    logger.info("API startup complete")
    
    yield
    
    logger.info("API shutting down")


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.app_name,
    description="Generate and edit N8N workflows using AI",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs" if settings.is_development else None,  # Disable docs in production
    redoc_url="/redoc" if settings.is_development else None  # Disable redoc in production
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add trusted host middleware for production
if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["autokraft.app", "*.autokraft.app", "localhost", "127.0.0.1"]
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

app.include_router(workflows.router)
app.include_router(messages.router)


@app.get("/")
@limiter.limit("30/minute")
async def root(request: Request):
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment.value,
        "docs": "/docs",
        "health": "/v1/workflows/health"
    }


@app.get("/health")
@limiter.limit("60/minute")
async def health(request: Request):
    return {
        "status": "healthy",
        "version": settings.app_version,
        "environment": settings.environment.value
    }
