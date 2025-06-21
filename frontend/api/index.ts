import { supabase } from '@/lib/supabase';
import { ChatRequest, ChatResponse } from '@/types/api';
import { API_CONFIG } from '@/lib/api/config';

// Direct Supabase API calls - simple and clean
export const workflowAPI = {
  // Get all workflows for a user
  list: async (userId: string) => {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get single workflow
  get: async (workflowId: string, userId: string) => {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('owner_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create workflow
  create: async (workflowData: any) => {
    const { data, error } = await supabase
      .from('workflows')
      .insert(workflowData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update workflow
  update: async (workflowId: string, userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', workflowId)
      .eq('owner_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete workflow
  delete: async (workflowId: string, userId: string) => {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId)
      .eq('owner_id', userId);
    
    if (error) throw error;
    return true;
  },
};

export const conversationAPI = {
  // Get conversations for a specific workflow
  listByWorkflow: async (workflowId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          id,
          content,
          role,
          message_type,
          workflow_data,
          token_count,
          created_at
        )
      `)
      .eq('workflow_id', workflowId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get conversations without workflow (for new workflow generation)
  listOrphan: async (userId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          id,
          content,
          role,
          message_type,
          workflow_data,
          token_count,
          created_at
        )
      `)
      .eq('user_id', userId)
      .is('workflow_id', null)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create conversation
  create: async (userId: string, workflowId?: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        workflow_id: workflowId || null,
        total_tokens: 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Link conversation to workflow
  linkToWorkflow: async (conversationId: string, workflowId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .update({ workflow_id: workflowId })
      .eq('id', conversationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

export const chatAPI = {
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

  // Send message to AI (direct fetch to backend)
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const authHeaders = await chatAPI.getAuthHeaders();
    const url = `${API_CONFIG.BASE_URL}/api/v1/workflows/chat`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,  // Add authentication!
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  // Get available models
  getModels: async () => {
    const authHeaders = await chatAPI.getAuthHeaders();
    const url = `${API_CONFIG.BASE_URL}/api/v1/workflows/models`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,  // Add authentication!
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🔍 Models fetch error:', error);
      throw error;
    }
  },
};
