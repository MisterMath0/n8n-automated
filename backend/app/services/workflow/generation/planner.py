"""
Workflow Planner Tool - First step in multi-step workflow generation.
Plans the structure and flow of an N8N workflow from user requirements.
"""

from typing import Dict, Any
import structlog

from ...tools.base_tool import BaseTool
from ....models.conversation import ToolCall, ToolResult
from ....models.workflow import AIModel
from ..schemas import create_workflow_plan_schema
from ....core.config_loader import config_loader

logger = structlog.get_logger()


class WorkflowPlannerTool(BaseTool):
    """Tool for planning workflow structure and flow"""
    
    @property
    def name(self) -> str:
        return "workflow_planner"
    
    @property
    def description(self) -> str:
        return "Plan the structure and flow of an N8N workflow from user requirements"
    
    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "user_description": {
                    "type": "string",
                    "description": "User's description of the desired workflow"
                },
                "context": {
                    "type": "string", 
                    "description": "Additional context or requirements",
                    "default": ""
                }
            },
            "required": ["user_description"]
        }
    
    async def execute(self, tool_call: ToolCall) -> ToolResult:
        """Execute workflow planning (delegate to execute_with_model)"""
        return await self.execute_with_model(tool_call, AIModel.GEMINI_2_5_FLASH)
    
    async def execute_with_model(self, tool_call: ToolCall, model: AIModel) -> ToolResult:
        """Execute workflow planning with AI model"""
        try:
            user_description = tool_call.parameters.get("user_description", "")
            context = tool_call.parameters.get("context", "")
            
            if not user_description.strip():
                return self._create_error_result(tool_call, "User description cannot be empty")
            
            # Get planning prompt from config
            prompts_config = config_loader.load_config("prompts")
            planning_prompt = prompts_config["tools"]["workflow_planner"]["system_prompt"]
            
            # Build full prompt
            full_prompt = f"{planning_prompt}\n\nUser Request: {user_description}\nContext: {context}"
            
            # Call AI service with simple schema
            result = await self._call_ai_with_schema(
                prompt=full_prompt,
                schema=create_workflow_plan_schema(),
                model=model
            )
            
            logger.info("Workflow plan generated", 
                       workflow_name=result.get("workflow_name"),
                       trigger_type=result.get("trigger_type"),
                       nodes_count=len(result.get("node_sequence", [])),
                       model=model.value)
            
            return self._create_success_result(tool_call, {
                "workflow_plan": result,
                "planning_success": True
            })
            
        except Exception as e:
            logger.error("Workflow planning failed", error=str(e), model=model.value)
            return self._create_error_result(tool_call, f"Workflow planning failed: {str(e)}")
