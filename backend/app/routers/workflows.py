from fastapi import APIRouter, HTTPException, status
from typing import List
import structlog

from ..models.workflow import (
    WorkflowGenerationRequest,
    WorkflowGenerationResponse,
    WorkflowEditRequest,
    WorkflowEditResponse,
    AvailableModelsResponse,
    AIModelInfo,
    AIModel,
    AIProvider
)
from ..services.ai_service import ai_service
from ..core.config_loader import config_loader

logger = structlog.get_logger()
router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])


@router.post("/generate", response_model=WorkflowGenerationResponse)
async def generate_workflow(request: WorkflowGenerationRequest):
    try:
        workflow, generation_time, tokens_used = await ai_service.generate_workflow(
            description=request.description,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        logger.info(
            "Workflow generated successfully",
            model=request.model.value,
            generation_time=generation_time,
            tokens_used=tokens_used,
            node_count=len(workflow.nodes)
        )
        
        return WorkflowGenerationResponse(
            success=True,
            workflow=workflow,
            generation_time=generation_time,
            tokens_used=tokens_used,
            model_used=request.model
        )
        
    except ValueError as e:
        logger.error("Invalid input for workflow generation", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Workflow generation failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Workflow generation failed"
        )


@router.post("/edit", response_model=WorkflowEditResponse)
async def edit_workflow(request: WorkflowEditRequest):
    try:
        workflow, generation_time, tokens_used, changes = await ai_service.edit_workflow(
            workflow=request.workflow,
            edit_instruction=request.edit_instruction,
            model=request.model,
            temperature=request.temperature
        )
        
        logger.info(
            "Workflow edited successfully",
            model=request.model.value,
            generation_time=generation_time,
            tokens_used=tokens_used,
            changes_count=len(changes)
        )
        
        return WorkflowEditResponse(
            success=True,
            workflow=workflow,
            changes_made=changes,
            generation_time=generation_time,
            tokens_used=tokens_used,
            model_used=request.model
        )
        
    except ValueError as e:
        logger.error("Invalid input for workflow editing", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Workflow editing failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Workflow editing failed"
        )


@router.get("/models", response_model=AvailableModelsResponse)
async def get_available_models():
    try:
        models_config = config_loader.load_models()
        available_providers = ai_service.get_available_providers()
        
        models = []
        for model_enum in AIModel:
            if model_enum.value in models_config:
                model_config = models_config[model_enum.value]
                if available_providers.get(model_config.provider, False):
                    models.append(AIModelInfo(
                        name=model_config.name,
                        provider=AIProvider(model_config.provider),
                        description=f"{model_config.name} - {model_config.context_window:,} context window",
                        max_tokens=model_config.max_tokens,
                        cost_per_1k_input_tokens=model_config.cost_per_1k_input_tokens,
                        cost_per_1k_output_tokens=model_config.cost_per_1k_output_tokens,
                        supports_json_mode=model_config.supports_json_mode,
                        supports_streaming=model_config.supports_streaming,
                        context_window=model_config.context_window
                    ))
        
        return AvailableModelsResponse(models=models)
        
    except Exception as e:
        logger.error("Failed to get available models", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve available models"
        )


@router.get("/health")
async def health_check():
    try:
        available_providers = ai_service.get_available_providers()
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
            "provider_health": f"{active_providers}/{total_providers} providers available"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service health check failed"
        )
