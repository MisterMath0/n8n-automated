from typing import Dict, Any
import structlog

from .base_tool import BaseTool
from ...models.conversation import ToolCall, ToolResult, ToolType
from ...models.workflow import N8NWorkflow, AIModel
from ..doc_search_service import get_search_service

logger = structlog.get_logger()


class WorkflowGeneratorTool(BaseTool):
    """
    Tool for generating N8N workflows from user descriptions.
    
    This tool integrates with the existing workflow generation logic
    and optionally uses documentation search for enhanced context.
    """
    
    def __init__(self, workflow_generation_service):
        """Initialize with reference to legacy AI service for workflow generation"""
        self.workflow_generation_service = workflow_generation_service
        self.search_service = get_search_service()
    
    @property
    def name(self) -> str:
        return "workflow_generator"
    
    @property
    def description(self) -> str:
        from ...core.config_loader import config_loader
        prompts_config = config_loader.load_config("prompts")
        return prompts_config["tools"]["workflow_generator"]["description"]
    
    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "description": {
                    "type": "string",
                    "description": "User's workflow requirements and description"
                },
                "search_docs_first": {
                    "type": "boolean",
                    "description": "Whether to search documentation for latest node information first",
                    "default": False
                }
            },
            "required": ["description"]
        }
    
    async def execute(self, tool_call: ToolCall) -> ToolResult:
        """Execute workflow generation"""
        # This method is kept for compatibility but delegates to the model-aware one
        return await self.execute_with_model(tool_call, AIModel.GEMINI_2_5_FLASH)

    async def execute_with_model(self, tool_call: ToolCall, model: AIModel) -> ToolResult:
        """Execute workflow generation with specific model"""
        try:
            # Validate model parameter
            if model is None:
                return self._create_error_result(tool_call, "Model parameter is required")
            
            params = tool_call.parameters
            description = params.get("description", "")
            search_docs_first = params.get("search_docs_first", True)
            
            if not description.strip():
                return self._create_error_result(tool_call, "Description cannot be empty")
            
            # Optionally enhance description with documentation context
            enhanced_description = await self._enhance_with_docs(description, search_docs_first)
            
            # Generate workflow using the passed model
            workflow, generation_time, tokens_used = await self.workflow_generation_service.generate_workflow(
                description=enhanced_description,
                model=model,
                temperature=0.3,
                max_tokens=4000
            )
            
            logger.info(
                "Workflow generated via tool",
                workflow_name=workflow.name,
                nodes_count=len(workflow.nodes),
                generation_time=generation_time,
                used_docs_context=search_docs_first,
                model=model.value if model else "unknown"
            )
            
            return self._create_success_result(tool_call, {
                "workflow": workflow.model_dump(),
                "generation_time": generation_time,
                "tokens_used": tokens_used,
                "nodes_count": len(workflow.nodes),
                "workflow_name": workflow.name,
                "search_context_used": search_docs_first
            })
            
        except Exception as e:
            logger.error("Workflow generation tool failed", error=str(e))
            return self._create_error_result(tool_call, f"Workflow generation failed: {str(e)}")
    
    async def _enhance_with_docs(self, description: str, search_docs_first: bool = True) -> str:
        """Dynamic context based on model capabilities"""
        if not search_docs_first:
            return description
        
        # Get ALL relevant results
        search_results, stats = self.search_service.search(
            f"{description} nodes integrations parameters examples",
            top_k=100,  # Get even more!
            include_highlights=True
        )
        
        # Build comprehensive context
        context = f"\n\n=== N8N DOCUMENTATION ({stats.total_results} total results) ===\n"
        
        for result in search_results:
            context += f"\n## {result.title} (Score: {result.score:.2f})\n"
            context += f"{result.content}\n"
            if result.node_type:
                context += f"Node Type: {result.node_type}\n"
            context += "---\n"
        
        logger.info(f"Enhanced with {len(search_results)} documentation results")
        return description + context