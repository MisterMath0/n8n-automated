import time
from typing import List
import structlog
from google.genai import types

from ...models.conversation import ChatMessage, ChatResponse
from ...models.workflow import AIModel
from .ai_client_manager import AIClientManager
from .tool_definitions import ToolDefinitions
from .tool_executor import ToolExecutor
from .response_processor import ResponseProcessor
from ...core.config_loader import config_loader

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
            client, model_config = self.client_manager.get_client_and_config(model)
            
            # Build API messages
            api_messages = self._build_api_messages(messages)
            system_message = self._get_system_message()
            
            # Convert tools to Google format
            google_tools = self.tool_definitions.convert_tools_to_google_format()

            # New SDK: Pass everything into generate_content
            generation_config = types.GenerateContentConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
                tools=google_tools,
                system_instruction=system_message,
            )

            response = client.models.generate_content(
                model=model_config.model_id,
                contents=api_messages,
                config=generation_config,
            )
            
            generation_time = time.time() - start_time
            usage_metadata = response.usage_metadata
            tokens_used = usage_metadata.total_token_count if usage_metadata else None

            # Process response for tool calls or regular text
            if hasattr(response, 'function_calls') and response.function_calls:
                return await self._handle_tool_calls(
                    response.function_calls, "", model, generation_time, tokens_used, conversation_id
                )
            else:
                content = response.text if hasattr(response, 'text') else ""
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
    
    async def handle_chat_streaming(
        self,
        messages: List[ChatMessage],
        model: AIModel,
        temperature: float,
        max_tokens: int,
        conversation_id: str
    ):
        """Streaming version of handle_chat for Google Gemini"""
        start_time = time.time()
        
        try:
            client, model_config = self.client_manager.get_client_and_config(model)
            
            # Build API messages
            api_messages = self._build_api_messages(messages)
            system_message = self._get_system_message()
            
            # Convert tools to Google format
            google_tools = self.tool_definitions.convert_tools_to_google_format()

            # Simple streaming using the Google GenAI SDK
            async for event in self._simple_stream_response(
                client, model_config, api_messages, system_message, google_tools,
                temperature, max_tokens, conversation_id, start_time, model
            ):
                yield event
                    
        except Exception as e:
            logger.error("Google streaming chat handler failed", error=str(e))
            yield {
                "type": "error",
                "error": str(e),
                "conversation_id": conversation_id
            }
    
    async def _simple_stream_response(
        self, client, model_config, api_messages, system_message, google_tools,
        temperature, max_tokens, conversation_id, start_time, model
    ):
        """Stream response with proper thinking token support based on model config"""
        try:
            # Get thinking config from model configuration
            thinking_enabled = getattr(model_config, 'thinking_config', {}).get('enabled', False)
            thinking_budget = getattr(model_config, 'thinking_config', {}).get('thinking_budget', 0)
            
            logger.info(
                "Starting Google streaming with thinking support",
                model=model_config.model_id,
                thinking_enabled=thinking_enabled,
                thinking_budget=thinking_budget,
                conversation_id=conversation_id
            )
            
            # Prepare generation config with thinking if enabled
            generation_config = types.GenerateContentConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
                tools=google_tools,
                system_instruction=system_message
            )
            
            # Add thinking config for reasoning models
            if thinking_enabled and thinking_budget > 0:
                generation_config.thinking_config = types.ThinkingConfig(
                    thinking_budget=thinking_budget,
                    include_thoughts=True
                )
                logger.info("Enabled thinking config for reasoning model", thinking_budget=thinking_budget)
                yield {"type": "progress", "message": "🧠 Analyzing your request with enhanced reasoning..."}

            # Use the streaming method from Google GenAI SDK
            stream = client.models.generate_content_stream(
                model=model_config.model_id,
                contents=api_messages,
                config=generation_config
            )
            
            accumulated_text = ""
            accumulated_thinking = ""
            tool_calls = []
            tokens_used = 0
            thinking_complete = False
            
            logger.info("Started streaming from Google GenAI SDK", conversation_id=conversation_id)
            
            # Stream each chunk as it comes - this is the real streaming fix
            for chunk in stream:
                logger.debug("Received streaming chunk", 
                           has_candidates=hasattr(chunk, 'candidates'),
                           has_function_calls=hasattr(chunk, 'function_calls'),
                           has_usage=hasattr(chunk, 'usage_metadata'))
                
                # Handle thinking tokens first (for reasoning models)
                if hasattr(chunk, 'candidates') and chunk.candidates:
                    for candidate in chunk.candidates:
                        if hasattr(candidate, 'content') and candidate.content:
                            for part in candidate.content.parts:
                                # Check for thought summaries (new format)
                                if hasattr(part, 'thought') and part.thought:
                                    thinking_text = getattr(part, 'text', '') or str(part.thought)
                                    if thinking_text and thinking_text not in accumulated_thinking:
                                        new_thinking = thinking_text[len(accumulated_thinking):]
                                        accumulated_thinking += new_thinking
                                        yield {"type": "thinking", "content": new_thinking}
                                        logger.debug("Streamed thinking token", length=len(new_thinking))
                                
                                # Stream regular response tokens
                                elif hasattr(part, 'text') and part.text:
                                    # Mark thinking as complete when we start getting regular tokens
                                    if not thinking_complete and accumulated_thinking:
                                        thinking_complete = True
                                        yield {"type": "thinking_complete"}
                                        logger.info("Thinking phase completed", total_thinking_length=len(accumulated_thinking))
                                    
                                    if part.text not in accumulated_text:
                                        new_text = part.text[len(accumulated_text):] if part.text.startswith(accumulated_text) else part.text
                                        accumulated_text += new_text
                                        yield {"type": "message", "content": new_text}
                                        logger.debug("Streamed message token", length=len(new_text))
                
                # Handle function calls
                if hasattr(chunk, 'function_calls') and chunk.function_calls:
                    tool_calls.extend(chunk.function_calls)
                    logger.info("Received function calls", count=len(chunk.function_calls))
                
                # Handle usage metadata
                if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                    tokens_used = chunk.usage_metadata.total_token_count
            
            logger.info("Streaming completed", 
                       total_text_length=len(accumulated_text),
                       total_thinking_length=len(accumulated_thinking),
                       tool_calls_count=len(tool_calls),
                       tokens_used=tokens_used)
            
            # Handle tool calls if any
            if tool_calls:
                yield {"type": "progress", "message": "🔧 Executing workflow generation tools..."}
                async for event in self._stream_tool_execution(
                    tool_calls, accumulated_text, model, start_time, tokens_used, conversation_id
                ):
                    yield event
            else:
                # Regular response without tools
                final_response = self.response_processor.create_chat_response(
                    success=True,
                    message=accumulated_text,
                    conversation_id=conversation_id,
                    generation_time=time.time() - start_time,
                    model_used=model,
                    tokens_used=tokens_used
                )
                yield {"type": "final_response", "response": final_response}
                yield {"type": "done"}
                
        except Exception as e:
            logger.error("Google streaming failed", error=str(e), conversation_id=conversation_id)
            yield {"type": "error", "error": str(e), "conversation_id": conversation_id}
    
    async def _stream_tool_execution(
        self, function_calls, base_message: str, model: AIModel, start_time: float,
        tokens_used: int, conversation_id: str
    ):
        """Stream tool execution with progress updates"""
        tool_results = []
        
        # Execute all tool calls with progress updates
        for i, function_call in enumerate(function_calls):
            tool_name = function_call.name
            yield {"type": "tool", "name": tool_name, "status": "running"}
            
            tool_call = self.tool_executor.parse_google_tool_call(function_call)
            
            # Regular tool execution
            tool_result = await self.tool_executor.execute_tool_call(tool_call, model)
            tool_results.append(tool_result)
            yield {"type": "tool", "name": tool_name, "status": "complete"}
        
        # Process all tool results
        workflow, search_results, message, tools_used = self.response_processor.process_tool_results(
            tool_results, base_message
        )
        
        # Stream final results
        if message:
            yield {"type": "message", "content": message}
        if workflow:
            yield {"type": "workflow", "data": workflow.model_dump()}
        
        final_response = self.response_processor.create_chat_response(
            success=True,
            message=message,
            conversation_id=conversation_id,
            generation_time=time.time() - start_time,
            model_used=model,
            tokens_used=tokens_used,
            workflow=workflow,
            search_results=search_results,
            tools_used=tools_used
        )
        yield {"type": "final_response", "response": final_response}
        yield {"type": "done"}
    

        
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
        """Convert ChatMessage objects to Google API format."""
        api_messages = []
        for msg in messages:
            # Map roles to Google's 'user' and 'model'
            role = 'user' if msg.role == 'user' else 'model'
            
            # Skip system messages as they are handled in the model constructor
            if msg.role == 'system':
                continue
                
            api_messages.append({"role": role, "parts": [{"text": msg.content}]})
        return api_messages
    
    def _convert_tools_to_google_format(self) -> List:
        """Convert tool definitions to Google format"""
        try:
            return self.tool_executor.convert_tools_to_google_format()
        except Exception as e:
            logger.warning("Failed to convert tools to Google format", error=str(e))
            return None
    
    def _get_system_message(self) -> str:
        """Get system message for tool-based chat"""
        prompts_config = config_loader.load_config("prompts")
        return prompts_config["chat_system"]["default"]
