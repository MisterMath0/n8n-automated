from fastapi import APIRouter, HTTPException, status, Depends, Body, Request
from fastapi.responses import StreamingResponse
from typing import List
import structlog
import json
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..models.workflow import AIModel, AIProvider
from ..models.conversation import (
    ChatRequest,
)
from ..services.ai_service import ai_service
from ..services.doc_search_service import get_search_service
from ..core.config_loader import config_loader
from ..core.auth import get_current_user, CurrentUser

logger = structlog.get_logger()
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/v1/workflows", tags=["workflows"])


@router.post("/chat")
@limiter.limit("200/minute")  # 3+ requests per second for testing
async def chat_with_ai(
    request: Request,
    chat_request: ChatRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Chat with AI using streaming tool-based system"""
    async def generate_stream():
        try:
            async for event in ai_service.chat_with_tools_streaming(
                user_message=chat_request.user_message,
                conversation_id=chat_request.conversation_id,
                user=current_user,
                workflow_id=chat_request.workflow_id,
                model=chat_request.model,
                temperature=chat_request.temperature,
                max_tokens=chat_request.max_tokens
            ):
                # Handle ChatResponse serialization
                if event.get("type") == "final_response" and "response" in event:
                    response_obj = event["response"]
                    if hasattr(response_obj, 'model_dump'):
                        event["response"] = response_obj.model_dump()
                
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(
                "Chat streaming failed", 
                error=str(e), 
                user_id=current_user.id, 
                conversation_id=chat_request.conversation_id
            )
            error_event = {
                "type": "error",
                "error": "An internal error occurred while processing your request.",
                "conversation_id": chat_request.conversation_id
            }
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }
    )


@router.get("/models")
@limiter.limit("300/minute")  # 5 requests per second
async def get_available_models(request: Request):
    """Get available AI models"""
    try:
        models_config = config_loader.load_models()
        available_providers = ai_service.get_available_providers()
        
        models = []
        for model_enum in AIModel:
            if model_enum.value in models_config:
                model_config = models_config[model_enum.value]
                if available_providers.get(model_config.provider, False):
                    models.append({
                        "name": model_config.name,
                        "provider": model_config.provider,
                        "model_id": model_enum.value,
                        "context_window": model_config.context_window,
                        "max_tokens": model_config.max_tokens
                    })
        
        return {"models": models}
        
    except Exception as e:
        logger.error("Failed to get available models", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve available models. Please try again later."
        )


@router.get("/health")
@limiter.limit("120/minute")
async def health_check(request: Request):
    """Service health check"""
    try:
        available_providers = ai_service.get_available_providers()
        tool_info = ai_service.get_tool_info()
        total_providers = len(available_providers)
        active_providers = sum(available_providers.values())
        
        if active_providers == 0:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No AI providers available"
            )
        
        return {
            "status": "healthy",
            "providers": available_providers,
            "provider_health": f"{active_providers}/{total_providers} providers available",
            "tools": tool_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable. Please try again later."
        )


@router.patch("/conversations/{conversation_id}/workflow")
@limiter.limit("60/minute")  # 1 request per second
async def update_conversation_workflow(
    request: Request,
    conversation_id: str,
    workflow_id: str = Body(..., embed=True),
    current_user: CurrentUser = Depends(get_current_user)
):
    updated = await ai_service.supabase_service.update_conversation_workflow(conversation_id, current_user.id, workflow_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Conversation not found or not owned by user")
    return updated
