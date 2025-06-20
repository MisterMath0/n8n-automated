import json
import uuid
from typing import Dict, Any, List
import structlog

from ...models.conversation import ToolCall, ToolResult, ToolType
from .tool_definitions import ToolDefinitions

logger = structlog.get_logger()


class ToolExecutor:
    """
    Handles execution of AI tools and manages tool call lifecycle.
    
    Coordinates between AI model tool calls and actual tool implementations.
    """
    
    def __init__(self, tool_definitions: ToolDefinitions):
        """Initialize with tool definitions"""
        self.tool_definitions = tool_definitions
    
    async def execute_tool_call(self, tool_call: ToolCall, model=None) -> ToolResult:
        """Execute a single tool call"""
        try:
            # Validate tool call structure
            if not tool_call.name:
                return self._create_error_result(
                    tool_call, 
                    "Tool call has no name"
                )
            
            tool_name = tool_call.name.value if hasattr(tool_call.name, 'value') else str(tool_call.name)
            
            # Additional validation
            if not tool_name or tool_name.strip() == "":
                return self._create_error_result(
                    tool_call, 
                    "Tool name is empty"
                )
            
            # Get tool instance
            tool = self.tool_definitions.get_tool_by_name(tool_name)
            if not tool:
                return self._create_error_result(
                    tool_call, 
                    f"Unknown tool: {tool_name}"
                )
            
            # Execute tool with model context if available
            logger.info("Executing tool", tool_name=tool_name, tool_call_id=tool_call.id, model=model.value if model else None)
            
            # Pass model context to tool if it supports it
            if hasattr(tool, 'execute_with_model'):
                result = await tool.execute_with_model(tool_call, model)
            else:
                result = await tool.execute(tool_call)
            
            logger.info(
                "Tool execution completed",
                tool_name=tool_name,
                tool_call_id=tool_call.id,
                success=result.success
            )
            
            return result
            
        except Exception as e:
            logger.error(
                "Tool execution failed",
                tool_name=tool_call.name,
                tool_call_id=tool_call.id,
                error=str(e)
            )
            return self._create_error_result(tool_call, f"Tool execution failed: {str(e)}")
    
    async def execute_multiple_tools(self, tool_calls: List[ToolCall]) -> List[ToolResult]:
        """Execute multiple tool calls"""
        results = []
        
        for tool_call in tool_calls:
            result = await self.execute_tool_call(tool_call)
            results.append(result)
        
        return results
    
    def parse_anthropic_tool_call(self, tool_use_block) -> ToolCall:
        """Parse tool call from Anthropic response"""
        try:
            return ToolCall(
                name=ToolType(tool_use_block.name),
                parameters=tool_use_block.input,
                id=tool_use_block.id
            )
        except Exception as e:
            logger.error("Failed to parse Anthropic tool call", error=str(e))
            raise ValueError(f"Invalid Anthropic tool call: {str(e)}")
    
    def parse_openai_tool_call(self, tool_call_data) -> ToolCall:
        """Parse tool call from OpenAI response"""
        try:
            return ToolCall(
                name=ToolType(tool_call_data.function.name),
                parameters=json.loads(tool_call_data.function.arguments),
                id=tool_call_data.id
            )
        except Exception as e:
            logger.error("Failed to parse OpenAI tool call", error=str(e))
            raise ValueError(f"Invalid OpenAI tool call: {str(e)}")
    
    def parse_google_tool_call(self, function_call) -> ToolCall:
        """Parse tool call from Google response"""
        try:
            # Debug log the function call structure
            logger.debug("Parsing Google function call", function_call=str(function_call))
            
            # Extract function name and args from Google function call
            if not hasattr(function_call, 'name') or not function_call.name:
                raise ValueError("Google function call missing name")
                
            function_name = function_call.name
            function_args = function_call.args if hasattr(function_call, 'args') else {}
            
            # Validate function name is a valid ToolType
            try:
                tool_type = ToolType(function_name)
            except ValueError:
                logger.error("Invalid tool name from Google", function_name=function_name)
                raise ValueError(f"Unknown tool type: {function_name}")
            
            return ToolCall(
                name=tool_type,
                parameters=function_args,
                id=str(uuid.uuid4())  # Generate ID for Google calls
            )
        except Exception as e:
            logger.error("Failed to parse Google tool call", error=str(e), function_call=str(function_call))
            raise ValueError(f"Invalid Google tool call: {str(e)}")
    
    def _create_error_result(self, tool_call: ToolCall, error: str) -> ToolResult:
        """Create error result for tool call"""
        # Handle cases where tool_call attributes might be None
        tool_call_id = getattr(tool_call, 'id', None) or "unknown"
        tool_name = getattr(tool_call, 'name', None) or ToolType.WORKFLOW_GENERATOR
        
        return ToolResult(
            tool_call_id=tool_call_id,
            tool_name=tool_name,
            success=False,
            result={},
            error=error
        )
