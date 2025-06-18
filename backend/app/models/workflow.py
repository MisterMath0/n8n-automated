from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from enum import Enum
import uuid


class AIProvider(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GROQ = "groq"


class AIModel(str, Enum):
    CLAUDE_4_SONNET = "claude-4-sonnet"
    CLAUDE_4_OPUS = "claude-4-opus"
    GPT_4O = "gpt-4o"
    O3 = "o3"
    LLAMA_3_3_70B = "llama-3-3-70b"
    LLAMA_3_1_8B = "llama-3-1-8b"


class N8NNode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    typeVersion: Optional[float] = None
    position: List[int] = Field(default_factory=lambda: [0, 0])
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    credentials: Optional[Dict[str, Any]] = Field(default_factory=dict)
    webhookId: Optional[str] = None


class N8NConnection(BaseModel):
    node: str
    type: str = "main"
    index: int = 0


class N8NWorkflow(BaseModel):
    name: str
    nodes: List[N8NNode]
    connections: Dict[str, Dict[str, List[List[N8NConnection]]]] = Field(default_factory=dict)
    pinData: Optional[Dict[str, Any]] = Field(default_factory=dict)
    settings: Optional[Dict[str, Any]] = Field(default_factory=lambda: {"executionOrder": "v1"})
    active: bool = False
    versionId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tags: List[str] = Field(default_factory=list)


class WorkflowGenerationRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=2000)
    model: AIModel = Field(default=AIModel.CLAUDE_4_SONNET)
    temperature: float = Field(default=0.3, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=4000, ge=100, le=8000)


class WorkflowEditRequest(BaseModel):
    workflow: N8NWorkflow
    edit_instruction: str = Field(..., min_length=5, max_length=1000)
    model: AIModel = Field(default=AIModel.CLAUDE_4_SONNET)
    temperature: float = Field(default=0.3, ge=0.0, le=2.0)


class WorkflowGenerationResponse(BaseModel):
    success: bool
    workflow: Optional[N8NWorkflow] = None
    error: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
    generation_time: float
    tokens_used: Optional[int] = None
    model_used: AIModel


class WorkflowEditResponse(BaseModel):
    success: bool
    workflow: Optional[N8NWorkflow] = None
    error: Optional[str] = None
    changes_made: List[str] = Field(default_factory=list)
    generation_time: float
    tokens_used: Optional[int] = None
    model_used: AIModel


class AIModelInfo(BaseModel):
    name: str
    provider: AIProvider
    description: str
    max_tokens: int
    cost_per_1k_input_tokens: float
    cost_per_1k_output_tokens: float
    supports_json_mode: bool = True
    supports_streaming: bool = True
    context_window: int


class AvailableModelsResponse(BaseModel):
    models: List[AIModelInfo]


class HealthResponse(BaseModel):
    status: str
    version: str
    providers: Dict[str, bool]
    uptime: float
