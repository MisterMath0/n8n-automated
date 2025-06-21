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
  return useQuery({
    queryKey: workflowId ? conversationKeys.byWorkflow(workflowId) : ['conversations', 'empty'],
    queryFn: () => workflowId ? conversationAPI.listByWorkflow(workflowId) : [],
    enabled: !!workflowId,
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
    mutationFn: ({ workflowId }: { workflowId?: string } = {}) =>
      conversationAPI.create(user!.id, workflowId),
    onSuccess: (data, { workflowId }) => {
      // Invalidate appropriate conversation list
      if (workflowId) {
        queryClient.invalidateQueries({ queryKey: conversationKeys.byWorkflow(workflowId) });
      } else {
        queryClient.invalidateQueries({ queryKey: conversationKeys.orphan(user?.id || '') });
      }
    },
    onError: (error: Error) => {
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
