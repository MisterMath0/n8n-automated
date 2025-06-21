import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '@/api';
import { ChatRequest } from '@/types/api';
import { useToast } from '@/components/providers';
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
  
  return useMutation({
    mutationFn: chatAPI.sendMessage,
    onMutate: async (request: ChatRequest) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ 
        queryKey: conversationKeys.all 
      });
      
      // Get previous conversations for rollback
      const previousConversations = queryClient.getQueryData(
        request.workflow_id 
          ? conversationKeys.byWorkflow(request.workflow_id)
          : conversationKeys.orphan()
      );
      
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
      const queryKey = request.workflow_id 
        ? conversationKeys.byWorkflow(request.workflow_id)
        : conversationKeys.orphan();
        
      queryClient.setQueryData(queryKey, (old: any[]) => {
        if (!old) return old;
        
        return old.map((conversation: any) => {
          if (conversation.id === request.conversation_id) {
            return {
              ...conversation,
              messages: [...(conversation.messages || []), optimisticMessage],
              updated_at: new Date().toISOString()
            };
          }
          return conversation;
        });
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
      // Always refetch to get the real server state
      // This will replace optimistic updates with real data
      if (request.workflow_id) {
        queryClient.invalidateQueries({ 
          queryKey: conversationKeys.byWorkflow(request.workflow_id) 
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: conversationKeys.orphan() 
        });
      }
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
