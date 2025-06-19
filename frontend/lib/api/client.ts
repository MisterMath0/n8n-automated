import { APIError, APIResponse } from '@/types/api';
import { API_CONFIG, ENDPOINT_TIMEOUTS } from './config';
import { supabase } from '@/lib/supabase';

// Custom error class for API errors
export class APIClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIClientError';
  }
}

// Network error class
export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Timeout error class
export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class APIClient {
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
    this.defaultTimeout = API_CONFIG.TIMEOUT;
  }

  // Create timeout signal
  private createTimeoutSignal(timeout: number): AbortSignal {
    return AbortSignal.timeout(timeout);
  }

  // Sleep utility for retries
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if response is ok and parse appropriately
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJSON = contentType?.includes('application/json');

    let data: any;
    try {
      data = isJSON ? await response.json() : await response.text();
    } catch (error) {
      throw new APIClientError(
        'Failed to parse response',
        response.status,
        'PARSE_ERROR'
      );
    }

    if (!response.ok) {
      // 🔍 DEBUG: Log detailed error response for 422 errors
      if (response.status === 422) {
        console.error('🔍 [DEBUG] 422 Validation Error Details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          responseData: data,
          responseDataStringified: JSON.stringify(data, null, 2),
          contentType,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date().toISOString()
        });
      }
      
      // Handle FastAPI error format
      const errorMessage = data?.detail || data?.message || `HTTP ${response.status}`;
      const errorCode = data?.code || 'API_ERROR';
      
      throw new APIClientError(
        errorMessage,
        response.status,
        errorCode,
        data
      );
    }

    return data;
  }

  // Get auth headers from Supabase
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`
      };
    }
    
    return {};
  }

  // Main request method with retry logic
  private async requestWithRetry<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = API_CONFIG.RETRY_ATTEMPTS,
      retryDelay = API_CONFIG.RETRY_DELAY,
      ...fetchConfig
    } = config;

    // Get auth headers
    const authHeaders = await this.getAuthHeaders();

    let lastError: Error;

    // 🔍 DEBUG: Log outgoing request details
    if (fetchConfig.method === 'POST' && url.includes('/generate')) {
      console.log('🔍 [DEBUG] API Client sending request:', {
        url,
        method: fetchConfig.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...fetchConfig.headers,
        },
        body: fetchConfig.body,
        bodyParsed: fetchConfig.body ? JSON.parse(fetchConfig.body as string) : null,
        timeout,
        timestamp: new Date().toISOString()
      });
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const signal = this.createTimeoutSignal(timeout);
        
        const response = await fetch(url, {
          ...fetchConfig,
          signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeaders,
            ...fetchConfig.headers,
          },
        });

        // 🔍 DEBUG: Log response details for generate requests
        if (fetchConfig.method === 'POST' && url.includes('/generate')) {
          console.log('🔍 [DEBUG] API Client received response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            url: response.url,
            attempt: attempt + 1,
            timestamp: new Date().toISOString()
          });
        }

        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (
          error instanceof APIClientError && 
          error.status >= 400 && 
          error.status < 500 &&
          error.status !== 429 // Retry on rate limit
        ) {
          throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          throw new TimeoutError(timeout);
        }

        // If this is the last attempt, throw the error
        if (attempt === retries) {
          if (error instanceof APIClientError || error instanceof TimeoutError) {
            throw error;
          }
          throw new NetworkError('Network request failed', error as Error);
        }

        // Wait before retrying
        await this.sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    throw lastError!;
  }

  // GET request
  async get<T>(
    endpoint: string,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    return this.requestWithRetry<T>(url, {
      ...config,
      method: 'GET',
    });
  }

  // POST request
  async post<T>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    return this.requestWithRetry<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    return this.requestWithRetry<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    return this.requestWithRetry<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(
    endpoint: string,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    return this.requestWithRetry<T>(url, {
      ...config,
      method: 'DELETE',
    });
  }
}

// Create and export default client instance
export const apiClient = new APIClient();

// Export types and classes for external use
export { APIClient, type RequestConfig };
