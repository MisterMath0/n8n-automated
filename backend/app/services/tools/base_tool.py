from abc import ABC, abstractmethod
from typing import Dict, Any

from ...models.conversation import ToolCall, ToolResult


class BaseTool(ABC):
    """
    Abstract base class for all AI tools.
    
    Each tool must implement:
    - Tool name and description
    - Input schema definition  
    - Execution logic
    """
    
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
            tool_call_id=tool_call.id,
            tool_name=tool_call.name,
            success=True,
            result=result,
            error=None
        )
    
    def _create_error_result(self, tool_call: ToolCall, error: str) -> ToolResult:
        """Helper to create error tool result"""
        return ToolResult(
            tool_call_id=tool_call.id,
            tool_name=tool_call.name,
            success=False,
            result={},
            error=error
        )
