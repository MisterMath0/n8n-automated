import time
import uuid
from typing import List, Optional
import structlog

from ...models.conversation import ChatMessage, ChatResponse
from ...models.workflow import AIModel
from .ai_client_manager import AIClientManager
from .tool_definitions import ToolDefinitions
from .tool_executor import ToolExecutor
from .response_processor import ResponseProcessor
from .anthropic_chat_handler import AnthropicChatHandler
from .openai_chat_handler import OpenAIChatHandler
from .google_chat_handler import GoogleChatHandler

logger = structlog.get_logger()


class ToolBasedChatService:
    """
    Main service for tool-based AI chat with workflow generation and documentation search.
    
    Orchestrates:
    - AI client management
    - Tool execution
    - Response processing
    - Provider-specific chat handling
    """
    
    def __init__(self, legacy_ai_service=None):
        """Initialize with all components"""
        self.client_manager = AIClientManager()
            
        self.tool_definitions = ToolDefinitions(legacy_ai_service)
        self.tool_executor = ToolExecutor(self.tool_definitions)
        self.response_processor = ResponseProcessor()
        
        # Provider-specific handlers
        self.anthropic_handler = AnthropicChatHandler(
            self.client_manager,
            self.tool_definitions,
            self.tool_executor
        )
        self.openai_handler = OpenAIChatHandler(
            self.client_manager, 
            self.tool_definitions,
            self.tool_executor
        )
        self.google_handler = GoogleChatHandler(
            self.client_manager,
            self.tool_definitions,
            self.tool_executor
        )
    
    async def chat(
        self,
        messages: List[ChatMessage],
        model: AIModel = AIModel.CLAUDE_4_SONNET,
        temperature: float = 0.3,
        max_tokens: int = 4000,
        conversation_id: Optional[str] = None
    ) -> ChatResponse:
        """
        Main chat method with tool support.
        
        Args:
            messages: List of conversation messages
            model: AI model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            conversation_id: Optional conversation ID
            
        Returns:
            ChatResponse with message, workflow, and search results
        """
        start_time = time.time()
        conv_id = conversation_id or str(uuid.uuid4())
        
        try:
            # Validate model availability
            if not self.client_manager.is_model_available(model):
                return self.response_processor.create_error_response(
                    f"Model {model.value} is not available",
                    conv_id,
                    time.time() - start_time,
                    model
                )
            
            # Get model configuration
            _, model_config = self.client_manager.get_client_and_config(model)
            
            # Route to appropriate handler based on provider
            if model_config.provider == "google":
                return await self.google_handler.handle_chat(
                    messages, model, temperature, max_tokens, conv_id
                )
            elif model_config.provider == "anthropic":
                return await self.anthropic_handler.handle_chat(
                    messages, model, temperature, max_tokens, conv_id
                )
            elif model_config.provider in ["openai", "groq"]:
                return await self.openai_handler.handle_chat(
                    messages, model, temperature, max_tokens, conv_id
                )
            else:
                return self.response_processor.create_error_response(
                    f"Unsupported provider: {model_config.provider}",
                    conv_id,
                    time.time() - start_time,
                    model
                )
                
        except Exception as e:
            logger.error("Chat service failed", error=str(e), model=model.value)
            return self.response_processor.create_error_response(
                str(e),
                conv_id,
                time.time() - start_time,
                model
            )
    
    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        return self.client_manager.get_available_models()
    
    def get_available_providers(self) -> dict:
        """Get provider availability status"""
        return self.client_manager.get_available_providers()
    
    def get_tool_info(self) -> dict:
        """Get information about available tools"""
        return {
            "available_tools": self.tool_definitions.get_available_tools(),
            "tool_count": len(self.tool_definitions.get_available_tools())
        }
