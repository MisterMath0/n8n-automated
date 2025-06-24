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
            
        self.tool_definitions = ToolDefinitions(legacy_ai_service, self.client_manager)
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
                    f"Model {model} is not available",
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
            logger.error("Chat service failed", error=str(e), model=model)
            return self.response_processor.create_error_response(
                str(e),
                conv_id,
                time.time() - start_time,
                model
            )
    
    async def chat_streaming(
        self,
        messages: List[ChatMessage],
        model: AIModel = AIModel.CLAUDE_4_SONNET,
        temperature: float = 0.3,
        max_tokens: int = 4000,
        conversation_id: Optional[str] = None
    ):
        """Streaming version of chat method with tool support"""
        conv_id = conversation_id or str(uuid.uuid4())
        
        try:
            # Validate model availability
            if not self.client_manager.is_model_available(model):
                error_event = {
                    "type": "error",
                    "error": f"Model {model} is not available",
                    "conversation_id": conv_id
                }
                yield error_event
                return
            
            # Get model configuration
            _, model_config = self.client_manager.get_client_and_config(model)
            
            # Route to appropriate handler based on provider
            if model_config.provider == "google":
                async for event in self.google_handler.handle_chat_streaming(
                    messages, model, temperature, max_tokens, conv_id
                ):
                    yield event
            elif model_config.provider == "anthropic":
                # Anthropic non-streaming fallback with progress updates
                yield {"type": "progress", "message": "🔄 Processing with Claude..."}
                response = await self.anthropic_handler.handle_chat(
                    messages, model, temperature, max_tokens, conv_id
                )
                yield {"type": "message", "content": response.message}
                if response.workflow:
                    yield {"type": "workflow", "data": response.workflow.model_dump()}
                yield {"type": "final_response", "response": response}
                yield {"type": "done"}
            elif model_config.provider in ["openai", "groq"]:
                # OpenAI/Groq non-streaming fallback with progress updates
                provider_name = "OpenAI" if model_config.provider == "openai" else "Groq"
                yield {"type": "progress", "message": f"🔄 Processing with {provider_name}..."}
                response = await self.openai_handler.handle_chat(
                    messages, model, temperature, max_tokens, conv_id
                )
                yield {"type": "message", "content": response.message}
                if response.workflow:
                    yield {"type": "workflow", "data": response.workflow.model_dump()}
                yield {"type": "final_response", "response": response}
                yield {"type": "done"}
            else:
                error_event = {
                    "type": "error",
                    "error": f"Unsupported provider: {model_config.provider}",
                    "conversation_id": conv_id
                }
                yield error_event
                
        except Exception as e:
            logger.error("Streaming chat service failed", error=str(e), model=model)
            error_event = {
                "type": "error",
                "error": str(e),
                "conversation_id": conv_id
            }
            yield error_event
    
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
