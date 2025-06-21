import { supabase } from '@/lib/supabase';
import { ChatRequest, ChatResponse } from '@/types/api';

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
  // Send message to AI (direct fetch to backend)
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await fetch('/api/v1/workflows/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send message');
    }

    return response.json();
  },

  // Get available models
  getModels: async () => {
    const response = await fetch('/api/v1/workflows/models');
    
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    return response.json();
  },
};
