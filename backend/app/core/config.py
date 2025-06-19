from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
from enum import Enum


class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class AIModelConfig(BaseModel):
    name: str
    provider: str
    model_id: str
    base_url: Optional[str] = None  # Only for OpenAI-compatible providers
    api_key_env: str
    max_tokens: int
    cost_per_1k_input_tokens: float
    cost_per_1k_output_tokens: float
    supports_json_mode: bool = True
    supports_streaming: bool = True
    context_window: int = 128000


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )
    
    app_name: str = "N8N AI Workflow Generator"
    app_version: str = "2.0.0"
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = False
    
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"]
    )
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]
    
    anthropic_api_key: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    groq_api_key: Optional[str] = Field(default=None, alias="GROQ_API_KEY")
    
    rate_limit_requests_per_minute: int = 60
    rate_limit_burst: int = 10
    
    log_level: str = "INFO"
    log_format: str = "json"
    
    secret_key: str = Field(
        default="change-in-production",
        description="Secret key for JWT tokens"
    )
    
    database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")
    
    @property
    def is_development(self) -> bool:
        return self.environment == Environment.DEVELOPMENT
    
    @property
    def is_production(self) -> bool:
        return self.environment == Environment.PRODUCTION


settings = Settings()
