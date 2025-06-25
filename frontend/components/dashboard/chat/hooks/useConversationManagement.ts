import { useCallback, useEffect, useMemo } from 'react';

interface UseConversationManagementProps {
  workflowId: string | null;
  conversationId: string | null;
  conversations: any[];
  onConversationChange: (id: string) => void;
}

export function useConversationManagement({
  workflowId,
  conversationId,
  conversations,
  onConversationChange,
}: UseConversationManagementProps) {
  
  // Memoize current conversation to prevent unnecessary re-renders
  const currentConversation = useMemo(() => {
    return conversations.find(c => c.id === conversationId) || null;
  }, [conversations, conversationId]);

  // Only auto-select conversation if none is selected and we have conversations
  useEffect(() => {
    if (workflowId && conversations.length > 0 && !conversationId) {
      const workflowConversations = conversations.filter(c => c.workflow_id === workflowId);
      if (workflowConversations.length > 0) {
        const firstConversation = workflowConversations[0];
        onConversationChange(firstConversation.id);
      }
    }
  }, [workflowId, conversations.length, conversationId, onConversationChange]);

  const createNewConversation = useCallback(() => {
    onConversationChange('');
  }, [onConversationChange]);

  return {
    currentConversation,
    createNewConversation,
  };
}
