from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

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


app = FastAPI(
    title=settings.app_name,
    description="Generate and edit N8N workflows using AI",
    version=settings.app_version,
    lifespan=lifespan
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
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment.value,
        "docs": "/docs",
        "health": "/api/v1/workflows/health"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": settings.app_version,
        "environment": settings.environment.value
    }
