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


class GoogleChatHandler:
    """
    Handles Google Gemini chat interactions with tool support.
    
    Manages:
    - Google Gemini API calls
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
        """Handle chat with Google Gemini models"""
        start_time = time.time()
        
        try:
            client, model_config = self.client_manager._get_client_and_config(model)
            
            # Build API messages
            api_messages = self._build_api_messages(messages)
            system_message = self._get_system_message()
            
            # Convert tools to Google format
            google_tools = self._convert_tools_to_google_format()
            
            # Make API call using the new Google Gen AI SDK
            from google.genai import types
            
            response = client.models.generate_content(
                model=model_config.model_id,
                contents=api_messages,
                config=types.GenerateContentConfig(
                    system_instruction=system_message,
                    tools=google_tools if google_tools else None,
                    max_output_tokens=max_tokens,
                    temperature=temperature
                )
            )
            
            generation_time = time.time() - start_time
            tokens_used = getattr(response.usage, 'total_tokens', None) if hasattr(response, 'usage') else None
            
            # Process response
            if hasattr(response, 'function_calls') and response.function_calls:
                return await self._handle_tool_calls(
                    response.function_calls, response.text or "",
                    model, generation_time, tokens_used, conversation_id
                )
            else:
                # Regular text response
                content = response.text or ""
                return self.response_processor.create_chat_response(
                    success=True,
                    message=content,
                    conversation_id=conversation_id,
                    generation_time=generation_time,
                    model_used=model,
                    tokens_used=tokens_used
                )
                
        except Exception as e:
            logger.error("Google chat handler failed", error=str(e))
            return self.response_processor.create_error_response(
                str(e),
                conversation_id,
                time.time() - start_time,
                model
            )
    
    async def _handle_tool_calls(
        self,
        function_calls,
        base_message: str,
        model: AIModel,
        generation_time: float,
        tokens_used: int,
        conversation_id: str
    ) -> ChatResponse:
        """Handle tool calls in Google response"""
        tool_results = []
        
        # Execute all tool calls
        for function_call in function_calls:
            tool_call = self.tool_executor.parse_google_tool_call(function_call)
            tool_result = await self.tool_executor.execute_tool_call(tool_call)
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
    
    def _build_api_messages(self, messages: List[ChatMessage]) -> List[str]:
        """Convert ChatMessage objects to Google API format"""
        # Google Gen AI SDK expects simple string content for basic use
        api_messages = []
        
        for msg in messages:
            if msg.role.value == "user":
                api_messages.append(msg.content)
        
        # For simplicity, return the last user message
        # In a full implementation, you'd handle the conversation history properly
        return api_messages[-1] if api_messages else ""
    
    def _convert_tools_to_google_format(self) -> List:
        """Convert tool definitions to Google format"""
        try:
            # Convert our tool definitions to Python functions that Google SDK can understand
            tools = []
            
            for tool_name, tool in self.tool_definitions.tools.items():
                if tool_name == "workflow_generator":
                    def workflow_generator_func(description: str, search_docs_first: bool = False) -> str:
                        """Generate N8N workflows from user descriptions"""
                        return f"workflow_generated:{description}"
                    tools.append(workflow_generator_func)
                
                elif tool_name == "documentation_search":
                    def documentation_search_func(query: str, section_type: str = None, top_k: int = 5) -> str:
                        """Search N8N documentation for information"""
                        return f"search_executed:{query}"
                    tools.append(documentation_search_func)
            
            return tools if tools else None
        except Exception as e:
            logger.warning("Failed to convert tools to Google format", error=str(e))
            return None
    
    def _get_system_message(self) -> str:
        """Get system message for tool-based chat"""
        from ...core.config_loader import config_loader
        prompts_config = config_loader.load_config("prompts")
        return prompts_config["chat_system"]["default"]
