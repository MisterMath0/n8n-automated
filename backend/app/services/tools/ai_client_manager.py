from typing import Dict, Any, Optional, Tuple, List
import structlog

import openai
import anthropic

from ...models.workflow import AIModel
from ...core.config import settings
from ...core.config_loader import config_loader

logger = structlog.get_logger()


class AIClientManager:
    """
    Manages AI provider clients and configurations.
    
    Handles initialization and access to:
    - Anthropic Claude clients
    - OpenAI clients  
    - Groq clients (via OpenAI SDK)
    """
    
    def __init__(self):
        self.openai_clients: Dict[str, openai.OpenAI] = {}
        self.anthropic_client: Optional[anthropic.Anthropic] = None
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize all available AI provider clients"""
        models_config = config_loader.load_models()
        
        for model_key, model_config in models_config.items():
            api_key = getattr(settings, model_config.api_key_env.lower(), None)
            if not api_key:
                logger.warning("API key not found", model=model_key, env_var=model_config.api_key_env)
                continue
                
            try:
                if model_config.provider == "anthropic":
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
    
    def get_client_and_config(self, model: AIModel) -> Tuple[Any, Any]:
        """
        Get client and configuration for specified model.
        
        Returns:
            Tuple of (client, model_config)
            
        Raises:
            ValueError: If model is not available
        """
        model_config = config_loader.get_model_config(model.value)
        
        if model_config.provider == "anthropic":
            if not self.anthropic_client:
                raise ValueError(f"Anthropic client not available for model: {model.value}")
            return self.anthropic_client, model_config
            
        elif model_config.provider in ["openai", "groq"]:
            if model.value not in self.openai_clients:
                raise ValueError(f"OpenAI client not available for model: {model.value}")
            return self.openai_clients[model.value], model_config
            
        else:
            raise ValueError(f"Unsupported provider: {model_config.provider}")
    
    def is_model_available(self, model: AIModel) -> bool:
        """Check if model is available"""
        try:
            self.get_client_and_config(model)
            return True
        except ValueError:
            return False
    
    def get_available_providers(self) -> Dict[str, bool]:
        """Get availability status of all providers"""
        models_config = config_loader.load_models()
        providers = {}
        
        for model_key, model_config in models_config.items():
            provider = model_config.provider
            if provider == "anthropic":
                providers[provider] = self.anthropic_client is not None
            else:
                providers[provider] = model_key in self.openai_clients
        
        return providers
    
    def get_available_models(self) -> List[str]:
        """Get list of available model keys"""
        available_models = []
        
        if self.anthropic_client:
            models_config = config_loader.load_models()
            for model_key, model_config in models_config.items():
                if model_config.provider == "anthropic":
                    available_models.append(model_key)
        
        available_models.extend(list(self.openai_clients.keys()))
        return available_models
