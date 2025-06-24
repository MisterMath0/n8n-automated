from typing import List, Dict, Any

from ..workflow.generation import (
    WorkflowOrchestratorTool,
    AICallerService
)
from .documentation_search_tool import DocumentationSearchTool
from ...core.config_loader import config_loader


class ToolDefinitions:
    """
    Centralized tool definitions for AI models.
    
    Manages all available tools and provides definitions
    in the format expected by different AI providers.
    """
    
    def __init__(self, ai_service_legacy=None, client_manager=None):
        """Initialize with available tools"""
        self.tools = {}
        self.ai_caller = None
        
        # Load prompts configuration
        self.prompts_config = config_loader.load_config("prompts")
        
        # Create AI caller service if client manager is available
        if client_manager:
            self.ai_caller = AICallerService(client_manager)
        
        # Register new multi-step workflow generation
        self.tools["workflow_generator"] = WorkflowOrchestratorTool()
        self.tools["documentation_search"] = DocumentationSearchTool()
        
        # Set AI caller for all tools
        if self.ai_caller:
            for tool in self.tools.values():
                if hasattr(tool, 'set_ai_caller'):
                    tool.set_ai_caller(self.ai_caller)
    
    def get_anthropic_tools(self) -> List[Dict[str, Any]]:
        """Get tool definitions in Anthropic format"""
        return [tool.get_definition() for tool in self.tools.values()]
    
    def get_openai_tools(self) -> List[Dict[str, Any]]:
        """Get tool definitions in OpenAI format"""
        openai_tools = []
        
        for tool in self.tools.values():
            definition = tool.get_definition()
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": definition["name"],
                    "description": definition["description"],
                    "parameters": definition["input_schema"]
                }
            })
        
        return openai_tools
    
    def convert_tools_to_google_format(self) -> List[Dict[str, Any]]:
        """Get tool definitions in Google format"""
        google_tools = []
        
        for tool in self.tools.values():
            definition = tool.get_definition()
            google_tools.append({
                "function_declarations": [{
                    "name": definition["name"],
                    "description": definition["description"],
                    "parameters": definition["input_schema"]
                }]
            })
        
        return google_tools
    
    def get_tool_by_name(self, name: str):
        """Get tool instance by name"""
        return self.tools.get(name)
    
    def get_available_tools(self) -> List[str]:
        """Get list of available tool names"""
        return list(self.tools.keys())
    
    def has_tool(self, name: str) -> bool:
        """Check if tool is available"""
        return name in self.tools
