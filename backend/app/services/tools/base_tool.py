from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from ...models.conversation import ToolCall, ToolResult
from ...models.workflow import AIModel


class BaseTool(ABC):
    """
    Abstract base class for all AI tools.
    
    Each tool must implement:
    - Tool name and description
    - Input schema definition  
    - Execution logic
    """
    
    def __init__(self):
        self._ai_caller = None
    
    def set_ai_caller(self, ai_caller):
        """Set AI caller service"""
        self._ai_caller = ai_caller
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Tool name"""
        pass
    
    @property
    @abstractmethod 
    def description(self) -> str:
        """Tool description for the AI model"""
        pass
    
    @property
    @abstractmethod
    def input_schema(self) -> Dict[str, Any]:
        """JSON schema for tool input parameters"""
        pass
    
    @abstractmethod
    async def execute(self, tool_call: ToolCall) -> ToolResult:
        """Execute the tool with given parameters"""
        pass
    
    async def execute_with_model(self, tool_call: ToolCall, model: AIModel) -> ToolResult:
        """Execute the tool with specific model (for multi-step tools)"""
        # Default implementation delegates to execute()
        return await self.execute(tool_call)
    
    async def _call_ai_with_schema(self, prompt: str, schema: Dict[str, Any], model: AIModel) -> Dict[str, Any]:
        """Call AI with schema using unified service"""
        if not self._ai_caller:
            raise ValueError("AI caller service not set")
        return await self._ai_caller.call_with_schema(prompt, schema, model)
    
    def get_definition(self) -> Dict[str, Any]:
        """Get complete tool definition for AI model"""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema
        }
    
    def _create_success_result(self, tool_call: ToolCall, result: Dict[str, Any]) -> ToolResult:
        """Helper to create successful tool result"""
        return ToolResult(
            tool_call_id=getattr(tool_call, 'id', 'unknown') if tool_call else 'unknown',
            tool_name=getattr(tool_call, 'name', None) if tool_call else None,
            success=True,
            result=result,
            error=None
        )
    
    def _create_error_result(self, tool_call: ToolCall, error: str) -> ToolResult:
        """Helper to create error tool result"""
        return ToolResult(
            tool_call_id=getattr(tool_call, 'id', 'unknown') if tool_call else 'unknown',
            tool_name=getattr(tool_call, 'name', None) if tool_call else None,
            success=False,
            result={},
            error=error
        )
