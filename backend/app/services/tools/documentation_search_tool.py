from typing import Dict, Any, List
import structlog

from .base_tool import BaseTool
from ...models.conversation import ToolCall, ToolResult, SearchResult
from ..doc_search_service import get_search_service

logger = structlog.get_logger()


class DocumentationSearchTool(BaseTool):
    """
    Tool for searching N8N documentation database.
    
    Uses the BM25 search service to find relevant documentation,
    examples, and node information.
    """
    
    def __init__(self):
        """Initialize with search service"""
        self.search_service = get_search_service()
    
    @property
    def name(self) -> str:
        return "documentation_search"
    
    @property
    def description(self) -> str:
        from ...core.config_loader import config_loader
        prompts_config = config_loader.load_config("prompts")
        return prompts_config["tools"]["documentation_search"]["description"]
    
    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query for N8N documentation"
                },
                "section_type": {
                    "type": "string",
                    "enum": ["integration", "concept", "example", "general"],
                    "description": "Filter by specific section type if needed"
                },
                "top_k": {
                    "type": "integer",
                    "description": "Number of results to return (default: 5, max: 10)",
                    "default": 5,
                    "minimum": 1,
                    "maximum": 10
                }
            },
            "required": ["query"]
        }
    
    async def execute(self, tool_call: ToolCall) -> ToolResult:
        """Execute documentation search"""
        try:
            params = tool_call.parameters
            query = params.get("query", "").strip()
            section_type = params.get("section_type")
            top_k = min(params.get("top_k", 5), 10)  # Cap at 10
            
            if not query:
                return self._create_error_result(tool_call, "Query cannot be empty")
            
            # Build search filters
            filters = {}
            if section_type:
                filters["section_type"] = section_type
            
            # Execute search
            results, stats = self.search_service.search(
                query=query,
                top_k=top_k,
                filters=filters if filters else None,
                include_highlights=True
            )
            
            # Convert to serializable format
            search_results = self._format_results(results)
            
            logger.info(
                "Documentation search completed",
                query=query,
                results_found=len(results),
                search_time_ms=stats.search_time_ms,
                section_filter=section_type
            )
            
            return self._create_success_result(tool_call, {
                "results": search_results,
                "total_results": stats.total_results,
                "search_time_ms": stats.search_time_ms,
                "query": query,
                "section_type_filter": section_type,
                "cache_hit": stats.cache_hit
            })
            
        except Exception as e:
            logger.error("Documentation search tool failed", error=str(e))
            return self._create_error_result(tool_call, f"Documentation search failed: {str(e)}")
    
    def _format_results(self, results) -> List[Dict[str, Any]]:
        """Format search results for serialization"""
        formatted = []
        
        for result in results:
            formatted.append({
                "title": result.title,
                "content": result.content,
                "url": result.url,
                "score": result.score,
                "section_type": result.section_type,
                "node_type": result.node_type,
                "highlight": result.highlight,
                "word_count": result.word_count,
                "chunk_index": result.chunk_index
            })
        
        return formatted
