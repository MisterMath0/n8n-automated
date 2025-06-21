import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationAPI } from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/providers';

// Query keys for conversations
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  byWorkflow: (workflowId: string) => [...conversationKeys.lists(), 'workflow', workflowId] as const,
  orphan: (userId: string) => [...conversationKeys.lists(), 'orphan', userId] as const,
};

// Get conversations for a specific workflow
export function useWorkflowConversations(workflowId: string | null) {
  const { user } = useAuth();
  
  // CRITICAL FIX: Use consistent query keys with optimistic updates
  const queryKey = workflowId 
    ? conversationKeys.byWorkflow(workflowId)
    : conversationKeys.orphan(user?.id || '');
  
  console.log('🔍 DEBUG - useWorkflowConversations called:', {
    workflowId,
    queryKey,
    enabled: !!workflowId || !workflowId // Always enabled now
  });
  
  return useQuery({
    queryKey,
    queryFn: () => {
      console.log('🔍 DEBUG - Fetching conversations for:', { workflowId, userId: user?.id });
      return workflowId 
        ? conversationAPI.listByWorkflow(workflowId)
        : conversationAPI.listOrphan(user!.id);
    },
    enabled: !!user?.id, // Enable when we have user, regardless of workflow
  });
}

// Get orphan conversations (not linked to any workflow) for new workflow generation
export function useOrphanConversations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: conversationKeys.orphan(user?.id || ''),
    queryFn: () => conversationAPI.listOrphan(user!.id),
    enabled: !!user?.id,
  });
}

// Create conversation mutation
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  
  return useMutation({
    mutationFn: ({ workflowId }: { workflowId?: string } = {}) => {
      console.log('🔍 DEBUG - Creating conversation:', { workflowId, userId: user?.id });
      return conversationAPI.create(user!.id, workflowId);
    },
    onSuccess: (data, { workflowId }) => {
      console.log('🔍 DEBUG - Conversation created successfully:', {
        conversationId: data.id,
        workflowId,
        note: 'Immediately updating conversation list with new conversation'
      });
      
      // IMMEDIATE CACHE UPDATE (not invalidation):
      // Directly add the new conversation to the cache to show it immediately
      const queryKey = workflowId 
        ? conversationKeys.byWorkflow(workflowId)
        : conversationKeys.orphan(user?.id || '');
        
      queryClient.setQueryData(queryKey, (old: any[] = []) => {
        // Check if conversation already exists to avoid duplicates
        const exists = old.find(conv => conv.id === data.id);
        if (exists) {
          console.log('🔍 DEBUG - Conversation already in cache, updating it');
          return old.map(conv => conv.id === data.id ? data : conv);
        }
        
        console.log('🔍 DEBUG - Adding new conversation to cache');
        return [data, ...old]; // Add to beginning of list
      });
    },
    onError: (error: Error) => {
      console.error('🔍 DEBUG - Failed to create conversation:', error);
      toast.error(`Failed to create conversation: ${error.message}`);
    },
  });
}

// Link conversation to workflow mutation
export function useLinkConversationToWorkflow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  
  return useMutation({
    mutationFn: ({ conversationId, workflowId }: { conversationId: string; workflowId: string }) =>
      conversationAPI.linkToWorkflow(conversationId, workflowId),
    onSuccess: (data, { workflowId }) => {
      // Invalidate both orphan and workflow-specific conversations
      queryClient.invalidateQueries({ queryKey: conversationKeys.orphan(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: conversationKeys.byWorkflow(workflowId) });
    },
    onError: (error: Error) => {
      toast.error(`Failed to link conversation: ${error.message}`);
    },
  });
}
