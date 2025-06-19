import uuid
from typing import Dict, Any, Optional, List

import openai
import anthropic
import structlog

from ..models.workflow import AIModel
from ..models.conversation import ChatMessage, ChatResponse
from ..core.config import settings
from ..core.config_loader import config_loader
from .tools import ToolBasedChatService

logger = structlog.get_logger()


class AIServiceError(Exception):
    pass


class AIService:
    def __init__(self):
        self.openai_clients: Dict[str, openai.OpenAI] = {}
        self.anthropic_client: Optional[anthropic.Anthropic] = None
        self.google_client = None
        self._initialize_clients()
        
        # Tool-based chat service
        self.tool_chat_service = ToolBasedChatService(self)

    def _initialize_clients(self):
        models_config = config_loader.load_models()
        
        for model_key, model_config in models_config.items():
            api_key = getattr(settings, model_config.api_key_env.lower(), None)
            if not api_key:
                continue
                
            try:
                if model_config.provider == "google":
                    if not self.google_client:
                        # Use the new Google Gen AI SDK
                        try:
                            from google import genai
                            self.google_client = genai.Client(api_key=api_key)
                            logger.info("Google AI client initialized")
                        except ImportError:
                            logger.warning("google-genai package not installed, skipping Google models")
                            continue
                
                elif model_config.provider == "anthropic":
                    if not self.anthropic_client:
                        self.anthropic_client = anthropic.Anthropic(api_key=api_key)
                        logger.info("Anthropic client initialized")
                
                elif model_config.provider in ["openai", "groq"]:
                    client = openai.OpenAI(
                        api_key=api_key,
                        base_url=model_config.base_url
                    )
                    self.openai_clients[model_key] = client
                    logger.info("OpenAI-compatible client initialized", model=model_key, provider=model_config.provider)
                    
            except Exception as e:
                logger.warning("Failed to initialize client", model=model_key, error=str(e))
                continue

    def _get_client_and_config(self, model: AIModel):
        """Get client and config for a model (used by tools)"""
        model_config = config_loader.get_model_config(model.value)
        
        if model_config.provider == "google":
            if not self.google_client:
                raise AIServiceError(f"Google client not available for model: {model.value}")
            return self.google_client, model_config
            
        elif model_config.provider == "anthropic":
            if not self.anthropic_client:
                raise AIServiceError(f"Anthropic client not available for model: {model.value}")
            return self.anthropic_client, model_config
            
        elif model_config.provider in ["openai", "groq"]:
            if model.value not in self.openai_clients:
                raise AIServiceError(f"OpenAI client not available for model: {model.value}")
            return self.openai_clients[model.value], model_config
            
        else:
            raise AIServiceError(f"Unsupported provider: {model_config.provider}")

    async def chat_with_tools(
        self,
        messages: List[ChatMessage],
        model: AIModel = AIModel.GEMINI_2_5_FLASH,  # Default to free Gemini model
        temperature: float = 0.3,
        max_tokens: int = 4000,
        conversation_id: Optional[str] = None
    ) -> ChatResponse:
        """Tool-based chat with workflow generation and documentation search"""
        return await self.tool_chat_service.chat(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            conversation_id=conversation_id
        )

    def get_available_providers(self) -> Dict[str, bool]:
        models_config = config_loader.load_models()
        providers = {}
        
        for model_key, model_config in models_config.items():
            provider = model_config.provider
            if provider == "google":
                providers[provider] = self.google_client is not None
            elif provider == "anthropic":
                providers[provider] = self.anthropic_client is not None
            else:
                providers[provider] = model_key in self.openai_clients
        
        return providers

    def get_available_models(self) -> List[str]:
        available_models = []
        models_config = config_loader.load_models()
        
        # Add Google models
        if self.google_client:
            for model_key, model_config in models_config.items():
                if model_config.provider == "google":
                    available_models.append(model_key)
        
        # Add Anthropic models
        if self.anthropic_client:
            for model_key, model_config in models_config.items():
                if model_config.provider == "anthropic":
                    available_models.append(model_key)
        
        # Add OpenAI/Groq models
        available_models.extend(list(self.openai_clients.keys()))
        return available_models
    
    def get_tool_info(self) -> Dict[str, Any]:
        """Get information about available tools"""
        return self.tool_chat_service.get_tool_info()

    def get_system_prompt(self, prompt_type: str = "default") -> str:
        """Get system prompt from configuration"""
        prompts_config = config_loader.load_config("prompts")
        return prompts_config["chat_system"][prompt_type]

    def get_tool_prompt(self, tool_name: str, prompt_type: str = "description") -> str:
        """Get tool-specific prompt from configuration"""
        prompts_config = config_loader.load_config("prompts")
        return prompts_config["tools"][tool_name][prompt_type]


ai_service = AIService()
