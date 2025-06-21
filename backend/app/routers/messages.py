"""
Message API endpoints for serving frontend content from prompts.yaml configuration.
This replaces hardcoded frontend messages with backend-driven content.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
import yaml
import os
from pathlib import Path
import structlog

logger = structlog.get_logger()

router = APIRouter(
    prefix="/api/v1/messages",
    tags=["messages"]
)

def load_prompts_config() -> Dict[str, Any]:
    """Load prompts configuration from YAML file"""
    try:
        config_path = Path(__file__).parent.parent.parent / "config" / "prompts.yaml"
        with open(config_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    except Exception as e:
        logger.error("Failed to load prompts configuration", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load message configuration")

@router.get("/welcome")
async def get_welcome_message():
    """Get the welcome message for new conversations"""
    try:
        config = load_prompts_config()
        welcome_message = config.get("conversation", {}).get("welcome_message", "")
        
        return {
            "content": welcome_message.strip(),
            "type": "text",
            "sender": "assistant"
        }
    except Exception as e:
        logger.error("Failed to get welcome message", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get welcome message")

@router.get("/capabilities")
async def get_capabilities():
    """Get the capabilities message"""
    try:
        config = load_prompts_config()
        capabilities = config.get("conversation", {}).get("capabilities", "")
        
        return {
            "content": capabilities.strip(),
            "type": "text",
            "sender": "assistant"
        }
    except Exception as e:
        logger.error("Failed to get capabilities", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get capabilities")

@router.get("/templates")
async def get_response_templates():
    """Get response templates for different scenarios"""
    try:
        config = load_prompts_config()
        templates = config.get("responses", {})
        
        return {
            "workflow_generated": templates.get("workflow_generated", "").strip(),
            "documentation_found": templates.get("documentation_found", "").strip(),
            "no_results": templates.get("no_results", "").strip(),
            "error_handling": templates.get("error_handling", "").strip()
        }
    except Exception as e:
        logger.error("Failed to get response templates", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get response templates")

@router.get("/system-prompts")
async def get_system_prompts():
    """Get system prompts for different chat contexts"""
    try:
        config = load_prompts_config()
        chat_system = config.get("chat_system", {})
        
        return {
            "default": chat_system.get("default", "").strip(),
            "workflow_focused": chat_system.get("workflow_focused", "").strip()
        }
    except Exception as e:
        logger.error("Failed to get system prompts", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get system prompts")

@router.get("/contextual")
async def get_contextual_message(
    context: str,
    workflow_id: Optional[str] = None,
    user_name: Optional[str] = None
):
    """Get contextual messages with dynamic content"""
    try:
        config = load_prompts_config()
        
        # Get base message based on context
        if context == "welcome":
            base_message = config.get("conversation", {}).get("welcome_message", "")
        elif context == "capabilities":
            base_message = config.get("conversation", {}).get("capabilities", "")
        elif context == "safety":
            base_message = config.get("safety", {}).get("content_policy", "")
        else:
            raise HTTPException(status_code=400, detail=f"Unknown context: {context}")
        
        # Add dynamic content if needed
        message = base_message.strip()
        if user_name:
            message = f"Hi {user_name}! " + message
        
        return {
            "content": message,
            "type": "text",
            "sender": "assistant",
            "context": context,
            "workflow_id": workflow_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get contextual message", error=str(e), context=context)
        raise HTTPException(status_code=500, detail="Failed to get contextual message")

@router.get("/health")
async def messages_health():
    """Health check for messages service"""
    try:
        config = load_prompts_config()
        return {
            "status": "healthy",
            "prompts_loaded": bool(config),
            "available_contexts": list(config.keys()) if config else []
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
