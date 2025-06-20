import { useState, useCallback } from 'react';
import { Message } from '../types';
import { ChatRequest } from '@/types/api';
import { useChatWithAI } from '@/hooks/api';
import { useConversations } from '@/hooks/useConversations';
import { useToast } from '@/components/providers';

interface UseMessageHandlerProps {
  selectedModel: string;
  onWorkflowGenerated?: (workflow: any) => void;
}

export function useMessageHandler({ selectedModel, onWorkflowGenerated }: UseMessageHandlerProps) {
  const { chatWithAI, isChatting } = useChatWithAI();
  const { currentConversation, createConversation, setCurrentConversation, refetch } = useConversations();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState<string>('');

  const sendMessage = useCallback(async (
    userMessage: string,
    messages: Message[],
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  ) => {
    if (!userMessage.trim() || isChatting || isProcessing) return false;

    setIsProcessing(true);
    const tempMessageId = `temp-${Date.now()}`;

    try {
      // Get or create conversation
      let conversationId = currentConversation?.id;
      if (!conversationId) {
        const newConversation = await createConversation();
        if (!newConversation) {
          throw new Error("Failed to create conversation");
        }
        conversationId = newConversation.id;
        setCurrentConversation(newConversation);
      }

      // Add user message optimistically
      const tempUserMessage: Message = {
        id: tempMessageId,
        content: userMessage,
        sender: 'user',
        type: 'text'
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // Send to API
      setWorkflowProgress('Processing your request...');
      const request: ChatRequest = {
        user_message: userMessage,
        conversation_id: conversationId,
        model: selectedModel,
        temperature: 0.3,
        max_tokens: 4000,
      };

      const response = await chatWithAI(request);
      
      // Refresh to get latest messages from database
      await refetch();

      // Handle workflow if present
      if (response.workflow) {
        setWorkflowProgress('Generating workflow visualization...');
        onWorkflowGenerated?.(response.workflow);
      }

      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessageId));
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: '❌ Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error('Failed to send message');
      return false;
    } finally {
      setIsProcessing(false);
      setWorkflowProgress('');
    }
  }, [isChatting, isProcessing, currentConversation, createConversation, setCurrentConversation, chatWithAI, refetch, onWorkflowGenerated, toast]);

  return {
    sendMessage,
    isProcessing,
    workflowProgress,
    isChatting
  };
}
