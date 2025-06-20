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


class OpenAIChatHandler:
    """
    Handles OpenAI/Groq chat interactions with tool support.
    
    Manages:
    - OpenAI-compatible API calls
    - Tool function calling
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
        """Handle chat with OpenAI/Groq models"""
        start_time = time.time()
        
        try:
            client, model_config = self.client_manager.get_client_and_config(model)
            
            # Build API messages
            api_messages = self._build_api_messages(messages)
            
            # Make API call
            response = client.chat.completions.create(
                model=model_config.model_id,
                messages=api_messages,
                max_tokens=max_tokens,
                temperature=temperature,
                tools=self.tool_definitions.get_openai_tools()
            )
            
            generation_time = time.time() - start_time
            tokens_used = getattr(response.usage, 'total_tokens', None) if response.usage else None
            
            # Process response
            message = response.choices[0].message
            
            if message.tool_calls:
                return await self._handle_tool_calls(
                    message.tool_calls, message.content or "",
                    model, generation_time, tokens_used, conversation_id
                )
            else:
                # Regular text response
                content = message.content or ""
                return self.response_processor.create_chat_response(
                    success=True,
                    message=content,
                    conversation_id=conversation_id,
                    generation_time=generation_time,
                    model_used=model,
                    tokens_used=tokens_used
                )
                
        except Exception as e:
            logger.error("OpenAI chat handler failed", error=str(e))
            return self.response_processor.create_error_response(
                str(e),
                conversation_id,
                time.time() - start_time,
                model
            )
    
    async def _handle_tool_calls(
        self,
        tool_calls,
        base_message: str,
        model: AIModel,
        generation_time: float,
        tokens_used: int,
        conversation_id: str
    ) -> ChatResponse:
        """Handle tool calls in OpenAI response"""
        tool_results = []
        
        # Execute all tool calls
        for tool_call_data in tool_calls:
            tool_call = self.tool_executor.parse_openai_tool_call(tool_call_data)
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
        """Convert ChatMessage objects to OpenAI API format"""
        api_messages = [
            {
                "role": "system",
                "content": self._get_system_message()
            }
        ]
        
        for msg in messages:
            if msg.role != "system":  # Skip system messages (already added)
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
