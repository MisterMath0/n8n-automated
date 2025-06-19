// Main API entry point
// Provides a clean interface for the entire application

export { apiClient, APIClient } from './client';
export { API_CONFIG, API_ROUTES, ENDPOINT_TIMEOUTS } from './config';
export * from './services';

// Re-export types for convenience
export type * from '@/types/api';
