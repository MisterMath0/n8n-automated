import time
from typing import List
import structlog

from ...models.conversation import ChatMessage, ChatResponse
from ...models.workflow import AIModel
from .ai_client_manager import AIClientManager
from .tool_definitions import ToolDefinitions
from .tool_executor import ToolExecutor
from .response_processor import ResponseProcessor

logger = structlog.get_logger()


class AnthropicChatHandler:
    """
    Handles Anthropic Claude chat interactions with tool support.
    
    Manages:
    - Anthropic-specific API calls
    - Tool use detection and execution
    - Response formatting
    """
    
    def __init__(
        self,
        client_manager,
        tool_definitions: ToolDefinitions,
        tool_executor: ToolExecutor
    ):
        self.client_manager = client_manager
        self.tool_definitions = tool_definitions
        self.tool_executor = tool_executor
        self.response_processor = ResponseProcessor()
    
    async def handle_chat(
        self,
        messages: List[ChatMessage],
        model: AIModel,
        temperature: float,
        max_tokens: int,
        conversation_id: str
    ) -> ChatResponse:
        """Handle chat with Anthropic Claude"""
        start_time = time.time()
        
        try:
            client, model_config = self.client_manager.get_client_and_config(model)
            
            # Build API messages
            api_messages = self._build_api_messages(messages)
            system_message = self._get_system_message()
            
            # Make API call
            response = client.messages.create(
                model=model_config.model_id,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_message,
                messages=api_messages,
                tools=self.tool_definitions.get_anthropic_tools()
            )
            
            generation_time = time.time() - start_time
            tokens_used = response.usage.input_tokens + response.usage.output_tokens
            
            # Process response
            if response.stop_reason == "tool_use":
                return await self._handle_tool_use(
                    response, model, generation_time, tokens_used, conversation_id
                )
            else:
                # Regular text response
                content = response.content[0].text if response.content else ""
                return self.response_processor.create_chat_response(
                    success=True,
                    message=content,
                    conversation_id=conversation_id,
                    generation_time=generation_time,
                    model_used=model,
                    tokens_used=tokens_used
                )
                
        except Exception as e:
            logger.error("Anthropic chat handler failed", error=str(e))
            return self.response_processor.create_error_response(
                str(e),
                conversation_id,
                time.time() - start_time,
                model
            )
    
    async def _handle_tool_use(
        self,
        response,
        model: AIModel,
        generation_time: float,
        tokens_used: int,
        conversation_id: str
    ) -> ChatResponse:
        """Handle tool use in Anthropic response"""
        tool_results = []
        base_message = ""
        
        # Extract text content and tool uses
        for block in response.content:
            if hasattr(block, 'type'):
                if block.type == 'text' and block.text:
                    base_message += block.text
                elif block.type == 'tool_use':
                    # Parse and execute tool call
                    tool_call = self.tool_executor.parse_anthropic_tool_call(block)
                    tool_result = await self.tool_executor.execute_tool_call(tool_call, model)
                    tool_results.append(tool_result)
        
        # Process tool results
        workflow, search_results, message, tools_used = self.response_processor.process_tool_results(
            tool_results, base_message
        )
        
        return self.response_processor.create_chat_response(
            success=True,
            message=message,
            conversation_id=conversation_id,
            generation_time=generation_time,
            model_used=model,
            tokens_used=tokens_used,
            workflow=workflow,
            search_results=search_results,
            tools_used=tools_used
        )
    
    def _build_api_messages(self, messages: List[ChatMessage]) -> List[dict]:
        """Convert ChatMessage objects to Anthropic API format"""
        api_messages = []
        
        for msg in messages:
            if msg.role != "system":  # System messages handled separately
                api_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        return api_messages
    
    def _get_system_message(self) -> str:
        """Get system message for tool-based chat"""
        from ...core.config_loader import config_loader
        prompts_config = config_loader.load_config("prompts")
        return prompts_config["chat_system"]["default"]
