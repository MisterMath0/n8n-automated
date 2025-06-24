"""
Workflow Orchestrator Tool - Coordinates multi-step workflow generation process.
Orchestrates planning, node generation, and connection building to create complete workflows.
"""

import time
import uuid
from typing import Dict, Any, Optional
import structlog

from ...tools.base_tool import BaseTool
from .planner import WorkflowPlannerTool
from .nodes import NodeGeneratorTool  
from .connections import ConnectionBuilderTool
from ...tools.documentation_search_tool import DocumentationSearchTool
from ....models.conversation import ToolCall, ToolResult, ToolType
from ....models.workflow import N8NWorkflow, AIModel
from ....core.config_loader import config_loader

logger = structlog.get_logger()


class WorkflowOrchestratorTool(BaseTool):
    """Orchestrates multi-step workflow generation process"""
    
    def __init__(self):
        super().__init__()
        self.planner = WorkflowPlannerTool()
        self.node_generator = NodeGeneratorTool()
        self.connection_builder = ConnectionBuilderTool()
        # Documentation search tool will be imported if available
        self.doc_search = None
        try:
            self.doc_search = DocumentationSearchTool()
        except ImportError:
            logger.warning("DocumentationSearchTool not available")
    
    def set_ai_caller(self, ai_caller):
        """Set AI caller service for all sub-tools"""
        super().set_ai_caller(ai_caller)
        self.planner.set_ai_caller(ai_caller)
        self.node_generator.set_ai_caller(ai_caller)
        self.connection_builder.set_ai_caller(ai_caller)
        if self.doc_search:
            self.doc_search.set_ai_caller(ai_caller)
    
    @property
    def name(self) -> str:
        return "workflow_generator"  # Keep same name for compatibility
    
    @property
    def description(self) -> str:
        return "Generate complete N8N workflows through multi-step planning, node generation, and connection building"
    
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
                    "description": "Whether to search documentation for context",
                    "default": True
                }
            },
            "required": ["description"]
        }
    
    async def execute(self, tool_call: ToolCall) -> ToolResult:
        """Execute workflow generation (delegate to execute_with_model)"""
        return await self.execute_with_model(tool_call, AIModel.GEMINI_2_5_FLASH)
    
    async def execute_with_model(self, tool_call: ToolCall, model: AIModel) -> ToolResult:
        """Execute complete workflow generation process"""
        start_time = time.time()
        
        try:
            description = tool_call.parameters.get("description", "")
            search_docs = tool_call.parameters.get("search_docs_first", True)
            
            if not description.strip():
                return self._create_error_result(tool_call, "Description cannot be empty")
            
            logger.info("Starting multi-step workflow generation", 
                       description_length=len(description),
                       search_docs=search_docs,
                       model=model.value)
            
            # Step 1: Search documentation if requested
            doc_context = ""
            if search_docs and self.doc_search:
                doc_context = await self._search_documentation(description)
            
            # Step 2: Plan workflow
            plan_call = ToolCall(
                name=ToolType.WORKFLOW_PLANNER,
                parameters={
                    "user_description": description,
                    "context": doc_context
                },
                id=f"{tool_call.id}_plan"
            )
            plan_result = await self.planner.execute_with_model(plan_call, model)
            
            if not plan_result.success:
                return self._create_error_result(tool_call, f"Planning failed: {plan_result.error}")
            
            workflow_plan = plan_result.result["workflow_plan"]
            logger.info("Workflow planning completed", 
                       workflow_name=workflow_plan.get("workflow_name"))
            
            # Step 3: Generate nodes
            nodes_call = ToolCall(
                name=ToolType.NODE_GENERATOR,
                parameters={
                    "workflow_plan": workflow_plan,
                    "documentation_context": doc_context
                },
                id=f"{tool_call.id}_nodes"
            )
            nodes_result = await self.node_generator.execute_with_model(nodes_call, model)
            
            if not nodes_result.success:
                return self._create_error_result(tool_call, f"Node generation failed: {nodes_result.error}")
            
            generated_nodes = nodes_result.result["nodes"]
            logger.info("Node generation completed", nodes_count=len(generated_nodes))
            
            # Step 4: Build connections
            connections_call = ToolCall(
                name=ToolType.CONNECTION_BUILDER,
                parameters={
                    "workflow_plan": workflow_plan,
                    "generated_nodes": generated_nodes
                },
                id=f"{tool_call.id}_connections"
            )
            connections_result = await self.connection_builder.execute_with_model(connections_call, model)
            
            if not connections_result.success:
                # Fallback to sequential connections
                logger.warning("AI connection building failed, using sequential fallback")
                connections = self._create_sequential_connections(generated_nodes)
            else:
                connections = connections_result.result["connections"]
                logger.info("Connection building completed", 
                           connections_count=len(connections))
            
            # Step 5: Combine into final workflow
            workflow = self._build_final_workflow(workflow_plan, generated_nodes, connections)
            
            generation_time = time.time() - start_time
            
            logger.info("Multi-step workflow generation completed",
                       workflow_name=workflow.name,
                       nodes_count=len(generated_nodes),
                       connections_count=len(connections),
                       generation_time=generation_time)
            
            return self._create_success_result(tool_call, {
                "workflow": workflow.model_dump(),
                "generation_time": generation_time,
                "nodes_count": len(generated_nodes),
                "workflow_name": workflow.name,
                "multi_step_success": True,
                "steps_completed": ["planning", "node_generation", "connection_building"]
            })
            
        except Exception as e:
            logger.error("Workflow generation failed", error=str(e), model=model.value)
            return self._create_error_result(tool_call, f"Workflow generation failed: {str(e)}")
    
    async def _search_documentation(self, description: str) -> str:
        """Search documentation for relevant context"""
        if not self.doc_search:
            return ""
        
        try:
            search_call = ToolCall(
                name=ToolType.DOCUMENTATION_SEARCH,
                parameters={"query": description},
                id="doc_search"
            )
            result = await self.doc_search.execute(search_call)
            
            if result.success and result.result.get("results"):
                # Combine top results into context
                results = result.result["results"][:3]  # Top 3 results
                context = "\\n\\n".join([
                    f"**{r.get('title', 'N/A')}**\\n{str(r.get('content', ''))[:500]}..." 
                    for r in results
                ])
                logger.info("Documentation context retrieved", 
                           results_count=len(results),
                           context_length=len(context))
                return context
        except Exception as e:
            logger.warning("Documentation search failed", error=str(e))
        
        return ""
    
    def _build_final_workflow(self, plan: Dict, nodes: list, connections: Dict) -> N8NWorkflow:
        """Build final N8N workflow object"""
        workflow_data = {
            "id": str(uuid.uuid4()),
            "versionId": str(uuid.uuid4()),
            "name": plan.get("workflow_name", "Generated Workflow"),
            "nodes": nodes,
            "connections": connections,
            "active": False,
            "settings": {"executionOrder": "v1"},
            "tags": plan.get("required_integrations", [])
        }
        
        return N8NWorkflow(**workflow_data)
    
    def _create_sequential_connections(self, nodes: list) -> Dict:
        """Create fallback sequential connections"""
        connections = {}
        
        if len(nodes) < 2:
            return connections
        
        for i in range(len(nodes) - 1):
            source_name = nodes[i].get("name")
            target_name = nodes[i + 1].get("name")
            
            if not source_name or not target_name:
                continue
            
            connections[source_name] = {
                "main": [[{
                    "node": target_name,
                    "type": "main", 
                    "index": 0
                }]]
            }
        
        return connections
