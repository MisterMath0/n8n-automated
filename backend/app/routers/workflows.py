from fastapi import APIRouter, HTTPException, status, Depends, Body
from typing import List
import structlog

from ..models.workflow import AIModel, AIProvider
from ..models.conversation import (
    ChatRequest,
    ChatResponse,
    DocumentationSearchRequest,
    DocumentationSearchResponse
)
from ..services.ai_service import ai_service
from ..services.doc_search_service import get_search_service
from ..core.config_loader import config_loader
from ..core.auth import get_current_user, CurrentUser

logger = structlog.get_logger()
router = APIRouter(prefix="/v1/workflows", tags=["workflows"])


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Chat with AI using tool-based system for workflows and documentation search"""
    try:
        response = await ai_service.chat_with_tools(
            user_message=request.user_message,
            conversation_id=request.conversation_id,
            user=current_user,
            workflow_id=request.workflow_id,  # Pass workflow context!
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        logger.info(
            "Chat completed",
            model=request.model.value,
            tools_used=response.tools_used,
            generation_time=response.generation_time,
            workflow_generated=response.workflow is not None,
            search_results_count=len(response.search_results) if response.search_results else 0,
            user_id=current_user.id if current_user else None
        )
        
        return response
    except Exception as e:
        logger.error(
            "Chat failed", 
            error=str(e), 
            user_id=current_user.id, 
            conversation_id=request.conversation_id,
            user_message=request.user_message
        )
        return ChatResponse(success=False, error=str(e))


@router.post("/search-docs", response_model=DocumentationSearchResponse)
async def search_documentation(
    request: DocumentationSearchRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Search N8N documentation directly"""
    try:
        search_service = get_search_service()
        
        filters = {}
        if request.section_type:
            filters["section_type"] = request.section_type
        
        results, stats = search_service.search(
            query=request.query,
            top_k=request.top_k,
            filters=filters if filters else None,
            include_highlights=True
        )
        
        search_results = []
        for result in results:
            search_results.append({
                "title": result.title,
                "content": result.content,
                "url": result.url,
                "score": result.score,
                "section_type": result.section_type,
                "node_type": result.node_type,
                "highlight": result.highlight
            })
        
        logger.info(
            "Documentation search completed",
            query=request.query,
            results_found=len(results),
            search_time_ms=stats.search_time_ms,
            user_id=current_user.id if current_user else None
        )
        
        return DocumentationSearchResponse(
            success=True,
            results=search_results,
            query=request.query,
            total_results=stats.total_results,
            search_time_ms=stats.search_time_ms
        )
        
    except ValueError as e:
        logger.error("Invalid search request", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Documentation search failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Documentation search failed"
        )


@router.get("/models")
async def get_available_models():
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
            detail="Failed to retrieve available models"
        )


@router.get("/health")
async def health_check():
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
            detail="Service health check failed"
        )


@router.patch("/conversations/{conversation_id}/workflow")
async def update_conversation_workflow(
    conversation_id: str,
    workflow_id: str = Body(..., embed=True),
    current_user: CurrentUser = Depends(get_current_user)
):
    updated = await ai_service.supabase_service.update_conversation_workflow(conversation_id, current_user.id, workflow_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Conversation not found or not owned by user")
    return updated
