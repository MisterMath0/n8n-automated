import { API_CONFIG } from '@/lib/api/config';
import { supabase } from '@/lib/supabase';

export interface MessageResponse {
  content: string;
  type: 'text' | 'workflow' | 'error';
  sender: 'assistant' | 'user';
  context?: string;
  workflow_id?: string;
}

export interface ResponseTemplates {
  workflow_generated: string;
  documentation_found: string;
  no_results: string;
  error_handling: string;
}

export interface SystemPrompts {
  default: string;
  workflow_focused: string;
}

export const messagesAPI = {
  // Get auth headers from Supabase
  getAuthHeaders: async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`
      };
    }
    
    return {};
  },

  // Get welcome message for new conversations
  getWelcomeMessage: async (): Promise<MessageResponse> => {
    const authHeaders = await messagesAPI.getAuthHeaders();
    const url = `${API_CONFIG.BASE_URL}/v1/messages/welcome`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch welcome message: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  // Get capabilities message
  getCapabilities: async (): Promise<MessageResponse> => {
    const authHeaders = await messagesAPI.getAuthHeaders();
    const url = `${API_CONFIG.BASE_URL}/v1/messages/capabilities`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch capabilities: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  // Get response templates for different scenarios
  getResponseTemplates: async (): Promise<ResponseTemplates> => {
    const authHeaders = await messagesAPI.getAuthHeaders();
    const url = `${API_CONFIG.BASE_URL}/v1/messages/templates`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch response templates: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  // Get system prompts for different contexts
  getSystemPrompts: async (): Promise<SystemPrompts> => {
    const authHeaders = await messagesAPI.getAuthHeaders();
    const url = `${API_CONFIG.BASE_URL}/v1/messages/system-prompts`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch system prompts: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  // Get contextual message with dynamic content
  getContextualMessage: async (
    context: string, 
    workflowId?: string, 
    userName?: string
  ): Promise<MessageResponse> => {
    const authHeaders = await messagesAPI.getAuthHeaders();
    const params = new URLSearchParams({ context });
    if (workflowId) params.append('workflow_id', workflowId);
    if (userName) params.append('user_name', userName);
    
    const url = `${API_CONFIG.BASE_URL}/v1/messages/contextual?${params}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch contextual message: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  // Health check for messages service
  checkHealth: async () => {
    const authHeaders = await messagesAPI.getAuthHeaders();
    const url = `${API_CONFIG.BASE_URL}/v1/messages/health`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`Messages service health check failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },
};
