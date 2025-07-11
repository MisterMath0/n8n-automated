// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// API Routes
export const API_ROUTES = {
  WORKFLOWS: {
    GENERATE: '/v1/workflows/generate',
    EDIT: '/v1/workflows/edit',
    MODELS: '/v1/workflows/models',
    HEALTH: '/v1/workflows/health',
    CHAT: '/v1/workflows/chat',
  },
} as const;

// Request timeouts by endpoint type
export const ENDPOINT_TIMEOUTS = {
  DEFAULT: 10000,
  GENERATE: 60000, // AI generation can take longer
  EDIT: 30000,
  MODELS: 5000,
  HEALTH: 3000,
} as const;
