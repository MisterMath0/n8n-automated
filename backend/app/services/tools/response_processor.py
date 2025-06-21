from typing import Dict, Any, Optional, List
import uuid
import structlog
import yaml
from pathlib import Path

from ...models.conversation import ChatResponse, SearchResult, ToolResult, ToolType
from ...models.workflow import N8NWorkflow, AIModel

logger = structlog.get_logger()


class ResponseProcessor:
    """
    Processes AI responses and tool results into standardized chat responses.
    
    Handles different response types:
    - Pure text responses
    - Tool-enhanced responses  
    - Error responses
    """
    
    def __init__(self):
        """Initialize response processor with prompts config"""
        self._prompts_config = None
    
    def _load_prompts_config(self) -> Dict[str, Any]:
        """Load prompts configuration from YAML file"""
        if self._prompts_config is None:
            try:
                config_path = Path(__file__).parent.parent.parent.parent / "config" / "prompts.yaml"
                with open(config_path, 'r', encoding='utf-8') as file:
                    self._prompts_config = yaml.safe_load(file)
            except Exception as e:
                logger.error("Failed to load prompts configuration", error=str(e))
                self._prompts_config = {}
        return self._prompts_config
    
    def create_chat_response(
        self,
        success: bool,
        message: str,
        conversation_id: str,
        generation_time: float,
        model_used: AIModel,
        tokens_used: Optional[int] = None,
        workflow: Optional[N8NWorkflow] = None,
        search_results: Optional[List[SearchResult]] = None,
        tools_used: Optional[List[ToolType]] = None,
        error: Optional[str] = None
    ) -> ChatResponse:
        """Create standardized chat response"""
        
        return ChatResponse(
            success=success,
            message=message,
            workflow=workflow,
            search_results=search_results,
            conversation_id=conversation_id,
            generation_time=generation_time,
            tokens_used=tokens_used,
            tools_used=tools_used or [],
            model_used=model_used
        )
    
    def process_tool_results(
        self,
        tool_results: List[ToolResult],
        base_message: str = ""
    ) -> tuple[Optional[N8NWorkflow], Optional[List[SearchResult]], str, List[ToolType]]:
        """
        Process tool results and extract workflow, search results, and message content.
        
        Returns:
            - workflow: Generated N8N workflow if any
            - search_results: Documentation search results if any  
            - message: Formatted message describing results
            - tools_used: List of tools that were used
        """
        workflow = None
        search_results = None
        tools_used = []
        message_parts = [base_message] if base_message else []
        
        for tool_result in tool_results:
            tools_used.append(tool_result.tool_name)
            
            if not tool_result.success:
                message_parts.append(f"Error with {tool_result.tool_name}: {tool_result.error}")
                continue
            
            if tool_result.tool_name == ToolType.WORKFLOW_GENERATOR:
                workflow = self._extract_workflow(tool_result)
                if workflow:
                    # Use template from prompts.yaml
                    config = self._load_prompts_config()
                    template = config.get("responses", {}).get("workflow_generated", "")
                    
                    if template:
                        # Format template with workflow data
                        nodes_count = len(workflow.nodes)
                        formatted_message = template.format(
                            workflow_name=workflow.name,
                            node_count=nodes_count,
                            workflow_description=getattr(workflow, 'description', f"A workflow with {nodes_count} nodes")
                        )
                        message_parts.append(formatted_message)
                    else:
                        # Fallback if template not found
                        nodes_count = len(workflow.nodes)
                        message_parts.append(
                            f"I've generated a workflow for you: '{workflow.name}' with {nodes_count} nodes."
                        )
                else:
                    message_parts.append("I generated a workflow but encountered an issue processing it.")
            
            elif tool_result.tool_name == ToolType.DOCUMENTATION_SEARCH:
                search_results = self._extract_search_results(tool_result)
                if search_results:
                    results_count = len(search_results)
                    search_time = tool_result.result.get("search_time_ms", 0)
                    message_parts.append(
                        f"I found {results_count} relevant documentation results "
                        f"(searched in {search_time:.1f}ms):"
                    )
                    
                    # Add top results summary
                    for i, result in enumerate(search_results[:3], 1):
                        content_preview = result.content[:150] + "..." if len(result.content) > 150 else result.content
                        message_parts.append(f"\\n**{i}. {result.title}**\\n{content_preview}")
                        
                    if len(search_results) > 3:
                        message_parts.append(f"\\n...and {len(search_results) - 3} more results.")
                else:
                    query = tool_result.result.get("query", "your query")
                    message_parts.append(f"I didn't find any relevant documentation for '{query}'.")
        
        final_message = "\\n".join(message_parts) if message_parts else "I completed the requested action."
        
        return workflow, search_results, final_message, tools_used
    
    def _extract_workflow(self, tool_result: ToolResult) -> Optional[N8NWorkflow]:
        """Extract N8N workflow from tool result"""
        try:
            workflow_data = tool_result.result.get("workflow")
            if workflow_data:
                return N8NWorkflow(**workflow_data)
        except Exception as e:
            logger.error("Failed to extract workflow from tool result", error=str(e))
        return None
    
    def _extract_search_results(self, tool_result: ToolResult) -> Optional[List[SearchResult]]:
        """Extract search results from tool result"""
        try:
            results_data = tool_result.result.get("results", [])
            if results_data:
                return [SearchResult(**result) for result in results_data]
        except Exception as e:
            logger.error("Failed to extract search results from tool result", error=str(e))
        return None
    
    def create_error_response(
        self,
        error_message: str,
        conversation_id: str,
        generation_time: float,
        model_used: AIModel,
        tools_used: Optional[List[ToolType]] = None
    ) -> ChatResponse:
        """Create error response"""
        return self.create_chat_response(
            success=False,
            message=f"I encountered an error: {error_message}",
            conversation_id=conversation_id,
            generation_time=generation_time,
            model_used=model_used,
            tools_used=tools_used or [],
            error=error_message
        )
