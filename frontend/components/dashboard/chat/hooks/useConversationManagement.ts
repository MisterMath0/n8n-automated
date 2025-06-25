import { useCallback, useEffect } from 'react';

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
  const currentConversation = conversations.find(c => c.id === conversationId) || null;

  useEffect(() => {
    if (workflowId && conversations.length > 0 && !conversationId) {
      const firstConversation = conversations[0];
      onConversationChange(firstConversation.id);
    }
  }, [workflowId, conversations, conversationId, onConversationChange]);

  const createNewConversation = useCallback(() => {
    onConversationChange('');
  }, [onConversationChange]);

  return {
    currentConversation,
    createNewConversation,
  };
}
