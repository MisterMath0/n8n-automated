import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '@/api';
import { ChatRequest } from '@/types/api';
import { useToast } from '@/components/providers';
import { useAuth } from '@/hooks/useAuth';
import { conversationKeys } from './useConversationData';

// Query keys for chat
export const chatKeys = {
  all: ['chat'] as const,
  models: () => [...chatKeys.all, 'models'] as const,
};

// Get available AI models
export function useModels() {
  return useQuery({
    queryKey: chatKeys.models(),
    queryFn: chatAPI.getModels,
    staleTime: 10 * 60 * 1000, // Models don't change often, cache for 10 minutes
  });
}

// Send message to AI with proper optimistic updates
export function useSendMessage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: chatAPI.sendMessage,
    onMutate: async (request: ChatRequest) => {
      // CRITICAL: Cancel ALL outgoing refetches to prevent race conditions
      // This is especially important after conversation creation
      await queryClient.cancelQueries({ 
        queryKey: conversationKeys.all 
      });
      
      // Determine correct query key based on workflow
      const queryKey = request.workflow_id 
        ? conversationKeys.byWorkflow(request.workflow_id)
        : conversationKeys.orphan(user?.id || '');
      
      // Get previous conversations for rollback
      const previousConversations = queryClient.getQueryData(queryKey);
      
      
      // Create optimistic user message
      const optimisticMessage = {
        id: `optimistic-${Date.now()}`,
        content: request.user_message,
        role: 'user' as const,
        message_type: 'text' as const,
        workflow_data: null,
        token_count: 0,
        created_at: new Date().toISOString()
      };
      
      // Optimistically update the conversation cache
      queryClient.setQueryData(queryKey, (old: any[]) => {
        // IMPROVED: Handle case where conversations might not be loaded yet
        if (!old) {
          // Create a minimal conversation object for the optimistic update
          const newConversation = {
            id: request.conversation_id,
            workflow_id: request.workflow_id,
            user_id: user?.id,
            messages: [optimisticMessage],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          return [newConversation];
        }
        
        // Find the conversation to update
        const conversationExists = old.find(c => c.id === request.conversation_id);
        
        if (!conversationExists) {
          // Add the conversation to the cache with the optimistic message
          const newConversation = {
            id: request.conversation_id,
            workflow_id: request.workflow_id,
            user_id: user?.id,
            messages: [optimisticMessage],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          return [...old, newConversation];
        }
        
        // Update existing conversation with optimistic message
        const updatedConversations = old.map((conversation: any) => {
          if (conversation.id === request.conversation_id) {
            return {
              ...conversation,
              messages: [...(conversation.messages || []), optimisticMessage],
              updated_at: new Date().toISOString()
            };
          }
          return conversation;
        });
        
        return updatedConversations;
      });
      
      // Return context for potential rollback
      return { 
        previousConversations,
        queryKey,
        optimisticMessage
      };
    },
    onError: (error: Error, request: ChatRequest, context: any) => {
      // Rollback optimistic update on error
      if (context?.previousConversations && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousConversations);
      }
      toast.error(`Failed to send message: ${error.message}`);
    },
    onSuccess: (response, request) => {
      // Success is handled by onSettled invalidation
      // No need to manually update cache here
    },
    onSettled: (response, error, request) => {
      // ✅ FIX: TkDodo's recommended pattern - Always invalidate
      // Let React Query handle race conditions internally
      // The flawed mutationCount logic caused race conditions
      const queryKey = request.workflow_id 
        ? conversationKeys.byWorkflow(request.workflow_id)
        : conversationKeys.orphan(user?.id || '');
      
      // Always invalidate to get the real server state
      // React Query will handle concurrent invalidations properly
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Helper hook to combine model data with send message functionality
export function useChat() {
  const { data: models, isLoading: modelsLoading, error: modelsError } = useModels();
  const sendMessageMutation = useSendMessage();
  
  const availableModels = models?.models || [];
  
  return {
    availableModels,
    modelsLoading,
    modelsError,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    sendingError: sendMessageMutation.error,
  };
}
