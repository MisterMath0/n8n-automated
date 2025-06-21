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

// Send message to AI
export function useSendMessage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: chatAPI.sendMessage,
    onSuccess: (response, request) => {
      // Invalidate conversations to refetch messages
      if (request.workflow_id) {
        queryClient.invalidateQueries({ 
          queryKey: conversationKeys.byWorkflow(request.workflow_id) 
        });
      } else {
        // For orphan conversations, we need to invalidate by conversation_id if possible
        queryClient.invalidateQueries({ 
          queryKey: conversationKeys.all 
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

// Helper hook to combine model data with send message functionality
export function useChat() {
  const { data: models, isLoading: modelsLoading, error: modelsError } = useModels();
  const sendMessage = useSendMessage();
  
  const availableModels = models?.models || [];
  
  return {
    availableModels,
    modelsLoading,
    modelsError,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
    sendingError: sendMessage.error,
  };
}
