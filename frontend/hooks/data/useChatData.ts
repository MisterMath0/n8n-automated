import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
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

// Send message to AI with streaming
export function useSendMessage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const [streamingState, setStreamingState] = useState({
    isStreaming: false,
    thinking: '',
    message: '',
    progress: '',
    tools: [] as string[],
    workflow: null as any,
    eventSource: null as EventSource | null,
    thinkingComplete: false
  });
  
  // Real-time streaming with flushSync to prevent React batching
  const sendMessage = useCallback((request: ChatRequest) => {
    // Cancel any existing stream
    if (streamingState.eventSource) {
      streamingState.eventSource.close();
    }

    // Reset streaming state
    setStreamingState({
      isStreaming: true,
      thinking: '',
      message: '',
      progress: '',
      tools: [],
      workflow: null,
      eventSource: null,
      thinkingComplete: false
    });

    // Add optimistic user message immediately - ONLY ONCE before streaming starts
    const queryKey = request.workflow_id 
      ? conversationKeys.byWorkflow(request.workflow_id)
      : conversationKeys.orphan(user?.id || '');
    
    const optimisticMessage = {
      id: `optimistic-${Date.now()}`,
      content: request.user_message,
      role: 'user' as const,
      message_type: 'text' as const,
      workflow_data: null,
      token_count: 0,
      created_at: new Date().toISOString()
    };
    
    queryClient.setQueryData(queryKey, (old: any[]) => {
      if (!old) {
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
      
      const conversationExists = old.find(c => c.id === request.conversation_id);
      
      if (!conversationExists) {
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

    // Start streaming - NO REACT QUERY INTERFERENCE during streaming
    const eventSource = chatAPI.sendMessage(request, (event) => {
      // ONLY update local state during streaming - NO queryClient calls
      switch (event.type) {
        case 'thinking':
          console.log('🧠 STREAMING EVENT - thinking token:', event.content.length, 'chars');
          setStreamingState(prev => ({ ...prev, thinking: prev.thinking + event.content }));
          break;
        case 'thinking_complete':
          setStreamingState(prev => ({ ...prev, thinkingComplete: true }));
          break;
        case 'progress':
          setStreamingState(prev => ({ ...prev, progress: event.message }));
          break;
        case 'tool':
          if (event.status === 'running') {
            setStreamingState(prev => ({ ...prev, tools: [...prev.tools, event.name] }));
          }
          break;
        case 'message':
          console.log('🟢 STREAMING EVENT - message token:', event.content.length, 'chars');
          setStreamingState(prev => {
            const newMessage = prev.message + event.content;
            console.log('🔄 SETTING STATE - total length now:', newMessage.length);
            return { ...prev, message: newMessage };
          });
          break;
        case 'workflow':
          setStreamingState(prev => ({ ...prev, workflow: event.data }));
          break;
        case 'done':
          setStreamingState(prev => ({ ...prev, isStreaming: false, eventSource: null }));
          break;
        case 'error':
          toast.error(event.error || 'Streaming failed');
          setStreamingState(prev => ({ ...prev, isStreaming: false, eventSource: null }));
          break;
        case 'final_response':
          // ONLY update React Query cache AFTER streaming completes
          if (event.response.message && event.response.message.trim()) {
            const aiMessage = {
              id: `ai-${Date.now()}`,
              content: event.response.message,
              role: 'assistant' as const,
              message_type: event.response.workflow ? 'workflow' : 'text' as const,
              workflow_data: event.response.workflow,
              token_count: event.response.tokens_used || 0,
              created_at: new Date().toISOString()
            };
            
            queryClient.setQueryData(queryKey, (old: any[]) => {
              if (!old) return old;
              
              return old.map((conversation: any) => {
                if (conversation.id === request.conversation_id) {
                  const existingMessage = conversation.messages?.find(
                    (msg: any) => msg.content === event.response.message && msg.role === 'assistant'
                  );
                  
                  if (!existingMessage) {
                    return {
                      ...conversation,
                      messages: [...(conversation.messages || []), aiMessage],
                      updated_at: new Date().toISOString()
                    };
                  }
                  return conversation;
                }
                return conversation;
              });
            });
          }
          
          setStreamingState(prev => ({ ...prev, isStreaming: false, eventSource: null }));
          break;
        default:
          break;
      }
    });

    setStreamingState(prev => ({ ...prev, eventSource }));
  }, [queryClient, toast, user, streamingState.eventSource]);

  const stopStreaming = useCallback(() => {
    if (streamingState.eventSource) {
      streamingState.eventSource.close();
      setStreamingState(prev => ({ 
        ...prev, 
        isStreaming: false, 
        eventSource: null 
      }));
    }
  }, [streamingState.eventSource]);

  return {
    sendMessage,
    stopStreaming,
    streamingState,
    isStreaming: streamingState.isStreaming
  };
}

// Helper hook to combine model data with send message functionality
export function useChat() {
  const { data: models, isLoading: modelsLoading, error: modelsError } = useModels();
  const { sendMessage, stopStreaming, streamingState, isStreaming } = useSendMessage();
  
  const availableModels = models?.models || [];
  
  return {
    availableModels,
    modelsLoading,
    modelsError,
    sendMessage,
    stopStreaming,
    streamingState,
    isSending: isStreaming,
    sendingError: null, // Errors are handled via events now
  };
}
