import { useQuery } from '@tanstack/react-query';
import { messagesAPI } from '@/api/messages';
import { MessageResponse, ResponseTemplates, SystemPrompts } from '@/api/messages';

// Query keys for messages
export const messageKeys = {
  all: ['messages'] as const,
  welcome: () => [...messageKeys.all, 'welcome'] as const,
  capabilities: () => [...messageKeys.all, 'capabilities'] as const,
  templates: () => [...messageKeys.all, 'templates'] as const,
  systemPrompts: () => [...messageKeys.all, 'system-prompts'] as const,
  contextual: (context: string, workflowId?: string, userName?: string) => 
    [...messageKeys.all, 'contextual', context, workflowId, userName] as const,
  health: () => [...messageKeys.all, 'health'] as const,
};

// Get welcome message
export function useWelcomeMessage() {
  return useQuery({
    queryKey: messageKeys.welcome(),
    queryFn: messagesAPI.getWelcomeMessage,
    staleTime: 30 * 60 * 1000, // Messages don't change often, cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });
}

// Get capabilities message
export function useCapabilities() {
  return useQuery({
    queryKey: messageKeys.capabilities(),
    queryFn: messagesAPI.getCapabilities,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

// Get response templates
export function useResponseTemplates() {
  return useQuery({
    queryKey: messageKeys.templates(),
    queryFn: messagesAPI.getResponseTemplates,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

// Get system prompts
export function useSystemPrompts() {
  return useQuery({
    queryKey: messageKeys.systemPrompts(),
    queryFn: messagesAPI.getSystemPrompts,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

// Get contextual message with dynamic content
export function useContextualMessage(
  context: string, 
  workflowId?: string, 
  userName?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: messageKeys.contextual(context, workflowId, userName),
    queryFn: () => messagesAPI.getContextualMessage(context, workflowId, userName),
    enabled,
    staleTime: 15 * 60 * 1000, // Contextual messages may change more often
    gcTime: 30 * 60 * 1000,
  });
}

// Messages service health check
export function useMessagesHealth() {
  return useQuery({
    queryKey: messageKeys.health(),
    queryFn: messagesAPI.checkHealth,
    staleTime: 5 * 60 * 1000, // Health checks should be more frequent
    gcTime: 10 * 60 * 1000,
    retry: 2, // Retry health checks
  });
}

// Helper hook that provides all message-related functionality
export function useMessages() {
  const welcomeMessage = useWelcomeMessage();
  const capabilities = useCapabilities();
  const templates = useResponseTemplates();
  const systemPrompts = useSystemPrompts();
  const health = useMessagesHealth();
  
  // Check if any message queries are loading
  const isLoading = welcomeMessage.isLoading || capabilities.isLoading || 
                    templates.isLoading || systemPrompts.isLoading;
  
  // Check if any message queries have errors
  const hasError = welcomeMessage.error || capabilities.error || 
                   templates.error || systemPrompts.error;
  
  // Check if the messages service is healthy
  const isHealthy = health.data?.status === 'healthy';
  
  return {
    // Message data
    welcomeMessage: welcomeMessage.data,
    capabilities: capabilities.data,
    templates: templates.data,
    systemPrompts: systemPrompts.data,
    
    // Loading states
    isLoading,
    isLoadingWelcome: welcomeMessage.isLoading,
    isLoadingCapabilities: capabilities.isLoading,
    isLoadingTemplates: templates.isLoading,
    isLoadingSystemPrompts: systemPrompts.isLoading,
    
    // Error states
    hasError,
    welcomeError: welcomeMessage.error,
    capabilitiesError: capabilities.error,
    templatesError: templates.error,
    systemPromptsError: systemPrompts.error,
    
    // Health status
    isHealthy,
    healthData: health.data,
    healthError: health.error,
    
    // Refetch functions
    refetchWelcome: welcomeMessage.refetch,
    refetchCapabilities: capabilities.refetch,
    refetchTemplates: templates.refetch,
    refetchSystemPrompts: systemPrompts.refetch,
    refetchHealth: health.refetch,
  };
}

// Convenience hook for getting a welcome message that's ready to display
export function useReadyWelcomeMessage() {
  const { welcomeMessage, isLoadingWelcome, welcomeError } = useMessages();
  
  // Return a fallback message if the API is unavailable
  const fallbackMessage = {
    id: 'fallback-welcome',
    content: "Hi! I'm your N8N workflow assistant. I can help you generate workflows, search documentation, and provide guidance. What would you like to work on today?",
    sender: 'assistant' as const,
    type: 'text' as const,
  };
  
  if (isLoadingWelcome) {
    return {
      message: null,
      isLoading: true,
      error: null,
    };
  }
  
  if (welcomeError || !welcomeMessage) {
    return {
      message: fallbackMessage,
      isLoading: false,
      error: welcomeError,
    };
  }
  
  return {
    message: {
      id: 'welcome-message',
      content: welcomeMessage.content,
      sender: welcomeMessage.sender,
      type: welcomeMessage.type,
    },
    isLoading: false,
    error: null,
  };
}
