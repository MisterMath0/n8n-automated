from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from enum import Enum
import uuid


class AIProvider(str, Enum):
    GOOGLE = "google"
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GROQ = "groq"


class AIModel(str, Enum):
    # Gemini models (Google AI) - Free tier with high context
    GEMINI_2_5_FLASH = "gemini-2-5-flash"
    GEMINI_1_5_FLASH = "gemini-1-5-flash"
    GEMINI_1_5_PRO = "gemini-1-5-pro"
    
    # Anthropic Claude models
    CLAUDE_4_SONNET = "claude-4-sonnet"
    CLAUDE_4_OPUS = "claude-4-opus"
    
    # OpenAI models
    GPT_4O = "gpt-4o"
    O3 = "o3"
    
    # Groq models
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
