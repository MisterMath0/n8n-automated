from typing import List, Dict, Any

from .workflow_generator_tool import WorkflowGeneratorTool
from .documentation_search_tool import DocumentationSearchTool
from ...core.config_loader import config_loader


class ToolDefinitions:
    """
    Centralized tool definitions for AI models.
    
    Manages all available tools and provides definitions
    in the format expected by different AI providers.
    """
    
    def __init__(self, ai_service_legacy=None):
        """Initialize with available tools"""
        self.tools = {}
        
        # Load prompts configuration
        self.prompts_config = config_loader.load_config("prompts")
        
        # Register available tools
        if ai_service_legacy:
            self.tools["workflow_generator"] = WorkflowGeneratorTool(ai_service_legacy)
        self.tools["documentation_search"] = DocumentationSearchTool()
    
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
    
    def get_tool_by_name(self, name: str):
        """Get tool instance by name"""
        return self.tools.get(name)
    
    def get_available_tools(self) -> List[str]:
        """Get list of available tool names"""
        return list(self.tools.keys())
    
    def has_tool(self, name: str) -> bool:
        """Check if tool is available"""
        return name in self.tools
