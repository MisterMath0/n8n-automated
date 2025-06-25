"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChat, useCreateConversation, useCreateWorkflow, useUpdateWorkflow } from "@/hooks/data";
import { useReadyWelcomeMessage } from "@/hooks/data";
import { useToast } from "@/components/providers";
import { ChatRequest } from "@/types/api";
import { ChatHeader } from "./ChatHeader";
import { ModelsError } from "./ModelsError";
import { ChatInput } from "./ChatInput";
import { MessagesArea } from "./MessagesArea";
import { ThinkingDisplay } from "./components";
import { ConversationHistoryAccordion } from "./ConversationHistoryAccordion";
import { AuthRequired } from "./components/AuthRequired";
import { useModelSelection, useMessages, useConversationManagement } from "./hooks";

interface SimpleChatProps {
  workflowId: string | null;
  conversationId: string | null;
  conversations: any[];
  onConversationChange: (id: string) => void;
  onClose: () => void;
  onWorkflowGenerated?: (workflow: any) => void;
}

export function SimpleChat({ 
  workflowId, 
  conversationId, 
  conversations, 
  onConversationChange, 
  onClose, 
  onWorkflowGenerated 
}: SimpleChatProps) {
  const { user } = useAuth();
  const toast = useToast();
  
  const { availableModels, modelsLoading, modelsError, sendMessage, isSending, streamingState } = useChat();
  const createConversation = useCreateConversation();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const { message: welcomeMessage } = useReadyWelcomeMessage();
  
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { selectedModel, setSelectedModel } = useModelSelection(availableModels);
  const { currentConversation, createNewConversation } = useConversationManagement({
    workflowId,
    conversationId,
    conversations,
    onConversationChange,
  });

  const messages = useMessages({
    currentConversation,
    welcomeMessage,
    isSending,
    streamingMessage: streamingState?.message || '',
    streamingState,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSending) {
        textareaRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isSending, conversationId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 250);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  const handleSendMessage = useCallback(async () => {
    const message = inputValue.trim();
    if (!message || !user || isSending) return;

    let activeConversationId = conversationId;

    if (activeConversationId && workflowId && currentConversation) {
      const conversationWorkflowId = currentConversation.workflow_id;
      if (conversationWorkflowId !== workflowId) {
        activeConversationId = null;
        onConversationChange('');
      }
    }

    if (!activeConversationId) {
      try {
        const newConversation = await createConversation.mutateAsync({ workflowId: workflowId || undefined });
        activeConversationId = newConversation.id;
        onConversationChange(activeConversationId);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        toast.error('Failed to create conversation');
        return;
      }
    }

    setInputValue("");
    
    const request: ChatRequest = {
      user_message: message,
      conversation_id: activeConversationId,
      workflow_id: workflowId,
      model: selectedModel,
      temperature: 0.3,
      max_tokens: 4000,
    };

    sendMessage(request);
  }, [inputValue, user, isSending, conversationId, workflowId, selectedModel, createConversation, sendMessage, onConversationChange, toast, currentConversation]);

  useEffect(() => {
    if (streamingState?.workflow && !isSending) {
      const handleWorkflowSave = async () => {
        try {
          if (!workflowId) {
            const savedWorkflow = await createWorkflow.mutateAsync({
              id: streamingState.workflow.id,
              name: streamingState.workflow.name,
              description: `Generated workflow with ${streamingState.workflow.nodes.length} nodes`,
              workflow_data: streamingState.workflow,
              owner_id: user?.id,
              status: 'active',
            });

            onWorkflowGenerated?.(savedWorkflow);
            toast.success(`New workflow "${savedWorkflow.name}" created successfully`);
          } else {
            const updatedWorkflow = await updateWorkflow.mutateAsync({
              workflowId: workflowId,
              updates: {
                workflow_data: streamingState.workflow,
                updated_at: new Date().toISOString(),
              },
            });

            onWorkflowGenerated?.(updatedWorkflow);
            toast.success(`Workflow "${updatedWorkflow.name}" updated successfully`);
          }
        } catch (error) {
          const errorMsg = workflowId 
            ? 'Workflow updated but failed to save changes to database' 
            : 'Workflow generated but failed to save to database';
          toast.error(errorMsg);
        }
      };

      handleWorkflowSave();
    }
  }, [streamingState?.workflow, isSending, workflowId, createWorkflow, updateWorkflow, onWorkflowGenerated, toast, user]);

  if (!user) {
    return <AuthRequired onClose={onClose} />;
  }

  const selectedModelInfo = availableModels.find(m => m.model_id === selectedModel);

  return (
    <div className="w-96 h-full bg-black/80 border-l border-white/10 flex flex-col overflow-hidden">
      <ChatHeader 
        selectedModelName={selectedModelInfo?.name}
        onClose={onClose}
        onModelChange={setSelectedModel}
        selectedModel={selectedModel}
        isGenerating={isSending}
      />

      {modelsError && <ModelsError error={modelsError.message || String(modelsError)} />}

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          <MessagesArea 
            messages={messages}
            isGenerating={isSending}
            messagesEndRef={messagesEndRef}
            workflowProgress={isSending ? streamingState?.progress : ''}
          />
        </div>
        
        <ThinkingDisplay 
          thinking={streamingState?.thinking || ''}
          isVisible={isSending && !!streamingState?.thinking}
          isComplete={streamingState?.thinkingComplete || false}
          className="mx-4 mb-2"
        />
      </div>

      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        textareaRef={textareaRef}
        handleSendMessage={handleSendMessage}
        isGenerating={isSending}
        availableModels={availableModels}
        selectedModel={selectedModel}
        modelsLoading={modelsLoading}
        onModelChange={setSelectedModel}
      />
      
      <ConversationHistoryAccordion
        conversations={conversations}
        activeConversationId={conversationId}
        workflowId={workflowId}
        onConversationSelect={onConversationChange}
        onCreateNew={createNewConversation}
      />
    </div>
  );
}
