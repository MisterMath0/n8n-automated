import { supabase } from '@/lib/supabase';
import { ChatRequest, ChatResponse } from '@/types/api';
import { API_CONFIG } from '@/lib/api/config';
import { transformWorkflowForUI, Workflow } from '@/types/workflow';

// Direct Supabase API calls - simple and clean
export const workflowAPI = {
  // Get all workflows for a user
  list: async (userId: string): Promise<Workflow[]> => {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform database rows to UI workflows
    return (data || []).map(transformWorkflowForUI);
  },

  // Get single workflow
  get: async (workflowId: string, userId: string): Promise<Workflow> => {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('owner_id', userId)
      .single();
    
    if (error) throw error;
    
    // Transform database row to UI workflow  
    return transformWorkflowForUI(data);
  },

  // Create workflow with race condition handling
  create: async (workflowData: any): Promise<Workflow> => {
    // Use upsert to handle potential race conditions during workflow creation
    const { data, error } = await supabase
      .from('workflows')
      .upsert(workflowData, {
        onConflict: 'id',
        ignoreDuplicates: false  // Update if exists
      })
      .select()
      .single();
    
    if (error) throw error;
    return transformWorkflowForUI(data);
  },

  // Update workflow with version control
  update: async (workflowId: string, userId: string, updates: any): Promise<Workflow> => {
    // First, get the current workflow for version control
    const { data: currentWorkflow, error: fetchError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('owner_id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Create version entry before updating
    if (currentWorkflow && updates.workflow_data) {
      // Get current version number
      const { data: versions, error: versionError } = await supabase
        .from('workflow_versions')
        .select('version_number')
        .eq('workflow_id', workflowId)
        .order('version_number', { ascending: false })
        .limit(1);
      
      const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;
      
      // Create version entry
      const { error: createVersionError } = await supabase
        .from('workflow_versions')
        .insert({
          workflow_id: workflowId,
          version_number: nextVersion,
          workflow_data: currentWorkflow.workflow_data,
          changes_summary: updates.description ? [updates.description] : ['Workflow updated via chat'],
          created_by: userId,
        });
      
      if (createVersionError) {
        console.warn('Failed to create version entry:', createVersionError);
        // Don't throw - continue with update even if versioning fails
      }
    }
    
    // Update the workflow
    const { data, error } = await supabase
      .from('workflows')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId)
      .eq('owner_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return transformWorkflowForUI(data);
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
      .order('updated_at', { ascending: false })
      .order('created_at', { foreignTable: 'messages', ascending: true }); // ✅ FIX: Order nested messages chronologically
    
    if (error) throw error;
    
    // ✅ BACKUP: Client-side sorting as fallback
    const sortedData = (data || []).map(conversation => ({
      ...conversation,
      messages: (conversation.messages || []).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }));
    
    return sortedData;
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
      .order('updated_at', { ascending: false })
      .order('created_at', { foreignTable: 'messages', ascending: true }); // ✅ FIX: Order nested messages chronologically
    
    if (error) throw error;
    
    // ✅ BACKUP: Client-side sorting as fallback
    const sortedData = (data || []).map(conversation => ({
      ...conversation,
      messages: (conversation.messages || []).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }));
    
    return sortedData;
  },

  // Create conversation (let database generate UUID)
  create: async (userId: string, workflowId?: string) => {
    
    // Simple insert - let database generate UUID to avoid race conditions
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        workflow_id: workflowId || null,
        total_tokens: 0,
      })
      .select()
      .single();
    
    if (error) {
      console.error('🔍 DEBUG - Failed to create conversation:', error);
      throw error;
    }
    
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

// Import messages API
export { messagesAPI } from './messages';

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

  // Send message to AI (streaming)
  sendMessage: (request: ChatRequest, onEvent: (event: any) => void): EventSource => {
    return chatAPI.sendMessageStreaming(request, onEvent);
  },

  sendMessageStreaming: (request: ChatRequest, onEvent: (event: any) => void): EventSource => {
    const url = `${API_CONFIG.BASE_URL}/v1/workflows/chat`;
    
    let abortController = new AbortController();
    
    // Use fetch streaming instead of EventSource for POST requests
    chatAPI.getAuthHeaders().then(async (authHeaders) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(request),
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body reader available');
        }

        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete SSE messages from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6).trim(); // Remove 'data: ' prefix
                if (jsonData) {
                  const data = JSON.parse(jsonData);
                  onEvent(data);
                }
              } catch (error) {
                console.error('Failed to parse streaming event:', error, 'Line:', line);
              }
            }
          }
        }
        
        // Process any remaining data in buffer
        if (buffer.trim() && buffer.startsWith('data: ')) {
          try {
            const jsonData = buffer.slice(6).trim();
            if (jsonData) {
              const data = JSON.parse(jsonData);
              onEvent(data);
            }
          } catch (error) {
            console.error('Failed to parse final streaming event:', error);
          }
        }
        
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to send chat request:', error);
          onEvent({ type: 'error', error: error.message });
        }
      }
    });

    // Return a proper EventSource-like object for compatibility
    return {
      close: () => {
        abortController.abort();
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      readyState: 1,
      url: url,
      withCredentials: false
    } as EventSource;
  },

  // Get available models
  getModels: async () => {
    const authHeaders = await chatAPI.getAuthHeaders();
    const url = `${API_CONFIG.BASE_URL}/v1/workflows/models`;
    
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
