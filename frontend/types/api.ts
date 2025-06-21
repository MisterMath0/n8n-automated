// Auto-generated types matching backend Pydantic models
// This ensures type safety between frontend and backend

export enum AIProvider {
  GOOGLE = "google",
  ANTHROPIC = "anthropic",
  OPENAI = "openai",
  GROQ = "groq"
}

export enum AIModel {
  // Gemini models (Google AI) - Free tier with high context
  GEMINI_2_5_FLASH = "gemini-2-5-flash",
  GEMINI_1_5_FLASH = "gemini-1-5-flash",
  GEMINI_1_5_PRO = "gemini-1-5-pro",
  
  // Anthropic Claude models
  CLAUDE_4_SONNET = "claude-4-sonnet",
  CLAUDE_4_OPUS = "claude-4-opus",
  
  // OpenAI models
  GPT_4O = "gpt-4o",
  O3 = "o3",
  
  // Groq models
  LLAMA_3_3_70B = "llama-3-3-70b",
  LLAMA_3_1_8B = "llama-3-1-8b"
}

export interface N8NNode {
  id: string;
  name: string;
  type: string;
  typeVersion?: number;
  position: [number, number];
  parameters?: Record<string, any>;
  credentials?: Record<string, any>;
  webhookId?: string;
}

export interface N8NConnection {
  node: string;
  type: string;
  index: number;
}

export interface N8NWorkflow {
  id: string;
  name: string;
  nodes: N8NNode[];
  connections: Record<string, Record<string, N8NConnection[][]>>;
  pinData?: Record<string, any>;
  settings?: Record<string, any>;
  active: boolean;
  versionId: string;
  meta?: Record<string, any>;
  tags: string[];
}

export interface WorkflowGenerationRequest {
  description: string;
  model?: AIModel;
  temperature?: number;
  max_tokens?: number;
}

export interface WorkflowEditRequest {
  workflow: N8NWorkflow;
  edit_instruction: string;
  model?: AIModel;
  temperature?: number;
}

export interface WorkflowGenerationResponse {
  success: boolean;
  workflow?: N8NWorkflow;
  error?: string;
  warnings: string[];
  generation_time: number;
  tokens_used?: number;
  model_used: AIModel;
}

export interface WorkflowEditResponse {
  success: boolean;
  workflow?: N8NWorkflow;
  error?: string;
  changes_made: string[];
  generation_time: number;
  tokens_used?: number;
  model_used: AIModel;
}

export interface AIModelInfo {
  name: string;
  provider: AIProvider;
  model_id: AIModel;
  description?: string;
  max_tokens: number;
  cost_per_1k_input_tokens: number;
  cost_per_1k_output_tokens: number;
  supports_json_mode?: boolean;
  supports_streaming?: boolean;
  context_window: number;
}

export interface AvailableModelsResponse {
  models: AIModelInfo[];
}

export interface HealthResponse {
  status: string;
  version: string;
  providers: Record<string, boolean>;
  uptime: number;
}

// Error response interface
export interface APIError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, any>;
}

// Generic API response wrapper
export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

// --- Chat API Types ---

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  user_message: string;
  conversation_id: string;
  workflow_id?: string;  // Add workflow context
  model?: AIModel;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  workflow?: N8NWorkflow;
  search_results?: any[]; // Use any for now, can be refined if SearchResult type is defined
  conversation_id: string;
  generation_time: number;
  tokens_used?: number;
  tools_used: string[];
  model_used: AIModel;
}
