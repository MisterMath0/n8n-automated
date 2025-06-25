import { useMemo } from 'react';
import { Message } from '../types';

interface UseMessagesProps {
  currentConversation: any;
  welcomeMessage: any;
  isSending: boolean;
  streamingMessage: string;
  streamingState: any;
}

export function useMessages({
  currentConversation,
  welcomeMessage,
  isSending,
  streamingMessage,
  streamingState,
}: UseMessagesProps): Message[] {
  return useMemo(() => {
    const conversationMessages = currentConversation?.messages
      ?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      ?.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'assistant' as const,
        type: (msg.message_type || 'text') as const,
        workflowData: msg.workflow_data
      })) || [];

    if (isSending && streamingMessage) {
      conversationMessages.push({
        id: 'streaming',
        content: streamingMessage,
        sender: 'assistant' as const,
        type: 'text' as const,
        isStreaming: true,
        progress: streamingState?.progress,
        tools: streamingState?.tools
      });
    }

    if (welcomeMessage) {
      return [welcomeMessage, ...conversationMessages];
    }

    return conversationMessages;
  }, [currentConversation, welcomeMessage, isSending, streamingMessage, streamingState]);
}
