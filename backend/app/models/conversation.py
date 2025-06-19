from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

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
    DOCUMENTATION_SEARCH = "documentation_search"


class ChatMessage(BaseModel):
    role: MessageRole = Field(..., description="Message role")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


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
    messages: List[ChatMessage] = Field(..., description="Conversation history")
    conversation_id: Optional[str] = Field(None, description="Optional conversation ID")
    model: AIModel = Field(default=AIModel.GEMINI_2_5_FLASH)  # Default to free Gemini model
    temperature: float = Field(default=0.3, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4000, ge=1, le=200000)


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
    section_type: Optional[str] = Field(None, description="Filter by section type")
    
    
class DocumentationSearchResponse(BaseModel):
    success: bool = Field(..., description="Whether search succeeded")
    results: List[SearchResult] = Field(..., description="Search results")
    query: str = Field(..., description="Original query")
    total_results: int = Field(..., description="Total number of results found")
    search_time_ms: float = Field(..., description="Search time in milliseconds")
