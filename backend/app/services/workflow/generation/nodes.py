"""
Node Generator Tool - Second step in multi-step workflow generation.
Generates N8N nodes based on workflow plan and requirements.
"""

import uuid
from typing import Dict, Any
import structlog

from ...tools.base_tool import BaseTool
from ....models.conversation import ToolCall, ToolResult
from ....models.workflow import AIModel
from ..schemas import create_workflow_nodes_schema
from ....core.config_loader import config_loader

logger = structlog.get_logger()


class NodeGeneratorTool(BaseTool):
    """Tool for generating N8N nodes from workflow plan"""
    
    @property
    def name(self) -> str:
        return "node_generator"
    
    @property
    def description(self) -> str:
        return "Generate N8N nodes based on workflow plan and requirements"
    
    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "workflow_plan": {
                    "type": "object",
                    "description": "The workflow plan from workflow_planner tool"
                },
                "documentation_context": {
                    "type": "string",
                    "description": "Relevant N8N documentation for node types",
                    "default": ""
                }
            },
            "required": ["workflow_plan"]
        }
    
    async def execute(self, tool_call: ToolCall) -> ToolResult:
        """Execute node generation (delegate to execute_with_model)"""
        return await self.execute_with_model(tool_call, AIModel.GEMINI_2_5_FLASH)
    
    async def execute_with_model(self, tool_call: ToolCall, model: AIModel) -> ToolResult:
        """Execute node generation with AI model"""
        try:
            workflow_plan = tool_call.parameters.get("workflow_plan", {})
            doc_context = tool_call.parameters.get("documentation_context", "")
            
            if not workflow_plan:
                return self._create_error_result(tool_call, "Workflow plan is required")
            
            # Get node generation prompt from config
            prompts_config = config_loader.load_config("prompts")
            node_prompt = prompts_config["tools"]["node_generator"]["system_prompt"]
            
            # Build full prompt
            full_prompt = f"{node_prompt}\n\nWorkflow Plan: {workflow_plan}\nDocumentation: {doc_context}"
            
            # Call AI service with simple nodes schema
            result = await self._call_ai_with_schema(
                prompt=full_prompt,
                schema=create_workflow_nodes_schema(),
                model=model
            )
            
            # Validate and fix nodes
            nodes = result.get("nodes", [])
            nodes = self._validate_and_fix_nodes(nodes)
            
            logger.info("Workflow nodes generated", 
                       nodes_count=len(nodes),
                       model=model.value)
            
            return self._create_success_result(tool_call, {
                "nodes": nodes,
                "generation_success": True,
                "nodes_count": len(nodes)
            })
            
        except Exception as e:
            logger.error("Node generation failed", error=str(e), model=model.value)
            return self._create_error_result(tool_call, f"Node generation failed: {str(e)}")
    
    def _validate_and_fix_nodes(self, nodes: list) -> list:
        """Validate and fix node data"""
        fixed_nodes = []
        
        for i, node in enumerate(nodes):
            if not isinstance(node, dict):
                logger.warning(f"Node {i} is not a dict, skipping")
                continue
            
            # Ensure required fields
            if "id" not in node or not node["id"]:
                node["id"] = str(uuid.uuid4())
            if "name" not in node or not node["name"]:
                node["name"] = f"Node {i+1}"
            if "type" not in node or not node["type"]:
                node["type"] = "n8n-nodes-base.set"  # Default to Set node
            if "position" not in node:
                node["position"] = [i * 200, 100]  # Spread horizontally
            if "parameters" not in node:
                node["parameters"] = {}
            if "credentials" not in node:
                node["credentials"] = {}
            
            # Ensure position is correct format
            if not isinstance(node["position"], list) or len(node["position"]) != 2:
                node["position"] = [i * 200, 100]
            
            # Ensure parameters and credentials are objects
            if not isinstance(node["parameters"], dict):
                node["parameters"] = {}
            if not isinstance(node["credentials"], dict):
                node["credentials"] = {}
            
            fixed_nodes.append(node)
        
        return fixed_nodes
