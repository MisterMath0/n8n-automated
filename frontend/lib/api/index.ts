// Export API client and error classes
export { apiClient, APIClient } from './client';
export { APIClientError, NetworkError, TimeoutError } from './client';
export type { RequestConfig } from './client';

// Export configuration
export { API_CONFIG, ENDPOINT_TIMEOUTS } from './config';
