import { useEffect, useCallback } from 'react';
import { Message } from '../types';
import { Conversation } from '@/hooks/useConversations';
import { welcomeMessage } from '../constants';

interface UseMessageLoaderProps {
  currentConversation: Conversation | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function useMessageLoader({ currentConversation, setMessages }: UseMessageLoaderProps) {
  const loadMessages = useCallback(() => {
    if (currentConversation?.messages && currentConversation.messages.length > 0) {
      const conversationMessages = currentConversation.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
        type: (msg.message_type || 'text') as 'text' | 'workflow' | 'error',
        workflowData: msg.workflow_data
      }));
      
      setMessages([welcomeMessage, ...conversationMessages]);
    } else {
      setMessages([welcomeMessage]);
    }
  }, [currentConversation, setMessages]);

  useEffect(() => {
    loadMessages();
  }, [currentConversation?.id]); // Only trigger when conversation ID changes

  return { loadMessages };
}
