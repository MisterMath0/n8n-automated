from fastapi import Depends, HTTPException, status
from typing import Annotated
import structlog

from ..services.ai_service import ai_service, AIService
from ..core.config import settings

logger = structlog.get_logger()


def get_ai_service() -> AIService:
    return ai_service


def validate_api_keys():
    available_providers = ai_service.get_available_providers()
    if not any(available_providers.values()):
        logger.error("No AI providers configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No AI providers available. Please configure API keys."
        )


AIServiceDep = Annotated[AIService, Depends(get_ai_service)]
