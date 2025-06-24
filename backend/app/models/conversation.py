from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum
import bleach
import re

from .workflow import AIModel, N8NWorkflow


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageType(str, Enum):
    TEXT = "text"
    WORKFLOW = "workflow"
    SEARCH_RESULTS = "search_results"
    ERROR = "error"


class ToolType(str, Enum):
    WORKFLOW_GENERATOR = "workflow_generator"
    WORKFLOW_PLANNER = "workflow_planner"
    NODE_GENERATOR = "node_generator"
    CONNECTION_BUILDER = "connection_builder"
    DOCUMENTATION_SEARCH = "documentation_search"


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[datetime] = None


class ToolCall(BaseModel):
    name: ToolType = Field(..., description="Tool name")
    parameters: Dict[str, Any] = Field(..., description="Tool parameters")
    id: str = Field(..., description="Tool call ID")


class ToolResult(BaseModel):
    tool_call_id: str = Field(..., description="Corresponding tool call ID")
    tool_name: ToolType = Field(..., description="Tool name")
    success: bool = Field(..., description="Whether tool execution succeeded")
    result: Dict[str, Any] = Field(..., description="Tool execution result")
    error: Optional[str] = Field(None, description="Error message if failed")


class SearchResult(BaseModel):
    title: str = Field(..., description="Document title")
    content: str = Field(..., description="Document content")
    url: str = Field(..., description="Document URL")
    score: float = Field(..., description="Relevance score")
    section_type: str = Field(..., description="Section type")
    node_type: Optional[str] = Field(None, description="N8N node type if applicable")
    highlight: Optional[str] = Field(None, description="Highlighted snippet")


class ChatRequest(BaseModel):
    user_message: str = Field(..., min_length=1, max_length=5000, description="The user's latest message.")
    conversation_id: str = Field(..., min_length=1, max_length=100, description="Conversation ID")
    workflow_id: Optional[str] = Field(None, min_length=1, max_length=100, description="Current workflow ID for context")
    model: AIModel = Field(default=AIModel.GEMINI_2_5_FLASH)  # Default to free Gemini model
    temperature: float = Field(default=0.3, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4000, ge=1, le=200000)
    
    @field_validator('user_message')
    @classmethod
    def sanitize_user_message(cls, v: str) -> str:
        """Sanitize user message to prevent XSS and injection attacks"""
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        
        # Remove HTML tags and suspicious content
        sanitized = bleach.clean(v, tags=[], strip=True)
        
        # Remove excessive whitespace
        sanitized = re.sub(r'\s+', ' ', sanitized).strip()
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'data:text/html',
            r'vbscript:',
            r'onload\s*=',
            r'onerror\s*='
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, sanitized, re.IGNORECASE):
                raise ValueError("Message contains potentially malicious content")
        
        return sanitized
    
    @field_validator('conversation_id', 'workflow_id')
    @classmethod
    def validate_ids(cls, v: Optional[str]) -> Optional[str]:
        """Validate ID fields contain only safe characters"""
        if v is None:
            return v
        
        # Allow only alphanumeric, hyphens, and underscores
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError("ID contains invalid characters")
        
        return v


class ChatResponse(BaseModel):
    success: bool = Field(..., description="Whether the chat succeeded")
    message: str = Field(..., description="AI response text")
    workflow: Optional[N8NWorkflow] = Field(None, description="Generated workflow if any")
    search_results: Optional[List[SearchResult]] = Field(None, description="Search results if any")
    conversation_id: str = Field(..., description="Conversation ID")
    generation_time: float = Field(..., description="Time taken to generate response")
    tokens_used: Optional[int] = Field(None, description="Tokens used in generation")
    tools_used: List[ToolType] = Field(default_factory=list, description="Tools that were used")
    model_used: AIModel = Field(..., description="Model used for generation")


class DocumentationSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    top_k: Optional[int] = Field(5, ge=1, le=20, description="Number of results to return")
    section_type: Optional[str] = Field(None, max_length=50, description="Filter by section type")
    
    @field_validator('query')
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        """Sanitize search query"""
        if not v or not v.strip():
            raise ValueError("Query cannot be empty")
        
        # Remove HTML tags and sanitize
        sanitized = bleach.clean(v, tags=[], strip=True)
        
        # Remove excessive whitespace
        sanitized = re.sub(r'\s+', ' ', sanitized).strip()
        
        return sanitized
    
    @field_validator('section_type')
    @classmethod
    def validate_section_type(cls, v: Optional[str]) -> Optional[str]:
        """Validate section type contains only safe characters"""
        if v is None:
            return v
        
        # Allow only alphanumeric, hyphens, underscores, and spaces
        if not re.match(r'^[a-zA-Z0-9_\- ]+$', v):
            raise ValueError("Section type contains invalid characters")
        
        return v
    
    
class DocumentationSearchResponse(BaseModel):
    success: bool = Field(..., description="Whether search succeeded")
    results: List[SearchResult] = Field(..., description="Search results")
    query: str = Field(..., description="Original query")
    total_results: int = Field(..., description="Total number of results found")
    search_time_ms: float = Field(..., description="Search time in milliseconds")
