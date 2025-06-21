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
      
      console.log('🔍 DEBUG - Optimistic update with proper cancellation:', {
        queryKey,
        workflowId: request.workflow_id,
        conversationId: request.conversation_id,
        userId: user?.id,
        note: 'Queries cancelled to prevent race conditions'
      });
      
      // Get previous conversations for rollback
      const previousConversations = queryClient.getQueryData(queryKey);
      
      console.log('🔍 DEBUG - Previous conversations found:', {
        count: Array.isArray(previousConversations) ? previousConversations.length : 'not array',
        hasData: !!previousConversations
      });
      
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
          console.log('🔍 DEBUG - No conversations in cache yet, creating new array with conversation');
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
          console.log('🔍 DEBUG - Conversation not in cache, adding it with optimistic message');
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
        
        console.log('🔍 DEBUG - Updated existing conversation with optimistic message');
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
      // Always refetch to get the real server state
      // This will replace optimistic updates with real data
      const queryKey = request.workflow_id 
        ? conversationKeys.byWorkflow(request.workflow_id)
        : conversationKeys.orphan(user?.id || '');
      
      console.log('🔍 DEBUG - Message mutation settled, checking for invalidation:', {
        queryKey,
        workflowId: request.workflow_id,
        error: error?.message,
        success: !error
      });
      
      // ADVANCED: Don't invalidate if other mutations are running
      // This prevents race conditions during concurrent operations
      const mutationCount = queryClient.isMutating();
      
      if (mutationCount > 1) {
        console.log('🔍 DEBUG - Other mutations running, skipping invalidation to prevent race conditions:', {
          mutationCount
        });
        return;
      }
      
      console.log('🔍 DEBUG - Safe to invalidate, no other mutations running');
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
