from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional, Union, Dict
from enum import Enum
import secrets


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
    supports_tools: bool = True
    context_window: int = 128000
    default_temperature: float = 0.3
    thinking_config: Optional[Dict[str, Union[bool, int]]] = Field(default_factory=dict)


class ChatSettingsConfig(BaseModel):
    default_context_window: int = Field(
        default=32000, 
        description="Default token limit for chat history context."
    )
    model_context_windows: Dict[str, int] = Field(
        default_factory=dict,
        description="Per-model overrides for chat history context window in tokens."
    )


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
    
    # CORS Settings - NO DEFAULTS in production for security
    cors_origins: Union[str, List[str]] = Field(
        default=[] if Environment.PRODUCTION else ["http://localhost:3000", "http://localhost:3001"],
        description="Allowed CORS origins - MUST be explicitly set in production"
    )
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_allow_headers: List[str] = ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"]
    
    anthropic_api_key: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    groq_api_key: Optional[str] = Field(default=None, alias="GROQ_API_KEY")
    google_api_key: Optional[str] = Field(default=None, alias="GOOGLE_API_KEY")
    
    rate_limit_requests_per_minute: int = 60
    rate_limit_burst: int = 10
    
    log_level: str = "INFO"
    log_format: str = "json"
    
    # Security - NO DEFAULTS in production
    secret_key: str = Field(
        description="JWT secret key - MUST be explicitly set in production"
    )
    
    @field_validator('secret_key')
    @classmethod
    def validate_secret_key_in_production(cls, v, info):
        """Ensure secret key is explicitly set in production"""
        if hasattr(info, 'data') and info.data.get('environment') == Environment.PRODUCTION:
            if not v or v == 'change-in-production':
                raise ValueError("SECRET_KEY must be explicitly set in production environment")
        return v or secrets.token_urlsafe(32)  # Generate for development
    
    # Supabase Configuration - NO DEFAULTS in production
    supabase_url: Optional[str] = Field(
        default=None, 
        alias="SUPABASE_URL",
        description="Supabase project URL - REQUIRED in production"
    )
    supabase_service_role_key: Optional[str] = Field(
        default=None, 
        alias="SUPABASE_SERVICE_ROLE_KEY",
        description="Supabase service role key - REQUIRED in production"
    )
    supabase_jwt_secret: Optional[str] = Field(
        default=None, 
        alias="SUPABASE_JWT_SECRET",
        description="Supabase JWT secret - REQUIRED in production"
    )
    
    # Documentation scraping
    apify_api_token: Optional[str] = Field(default=None, alias="APIFY_API_TOKEN")
    
    @field_validator('cors_origins')
    @classmethod
    def parse_cors_origins(cls, v, info):
        """Parse and validate CORS origins"""
        if isinstance(v, str):
            # Handle comma-separated string from .env
            v = [origin.strip() for origin in v.split(',') if origin.strip()]
        
        # In production, CORS origins must be explicitly set and not be empty
        if hasattr(info, 'data') and info.data.get('environment') == Environment.PRODUCTION:
            if not v or len(v) == 0:
                raise ValueError("CORS_ORIGINS must be explicitly set in production environment")
            # Check for wildcard origins in production
            for origin in v:
                if '*' in origin:
                    raise ValueError("Wildcard CORS origins are not allowed in production")
        
        return v or ["http://localhost:3000", "http://localhost:3001"]  # Default for development
    
    @property
    def is_development(self) -> bool:
        return self.environment == Environment.DEVELOPMENT
    
    @property
    def is_production(self) -> bool:
        return self.environment == Environment.PRODUCTION


settings = Settings()
