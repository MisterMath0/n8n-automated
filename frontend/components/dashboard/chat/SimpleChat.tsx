"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChat, useCreateConversation, useLinkConversationToWorkflow, useCreateWorkflow, useUpdateWorkflow } from "@/hooks/data";
import { AIModel, ChatRequest } from "@/types/api";
import { ChatHeader } from "./ChatHeader";
import { ModelsError } from "./ModelsError";
import { ChatInput } from "./ChatInput";
import { MessagesArea } from "./MessagesArea";
import { Message } from "./types";
import { DEFAULT_MODEL, SELECTED_MODEL_KEY } from "../../../types/constants";
import { useReadyWelcomeMessage } from "@/hooks/data";
import { ConversationHistoryAccordion } from "./ConversationHistoryAccordion";
import { AuthRequired } from "./components/AuthRequired";
import { useToast } from "@/components/providers";

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
  
  // Chat functionality
  const { availableModels, modelsLoading, modelsError, sendMessage, isSending } = useChat();
  const createConversation = useCreateConversation();
  const linkToWorkflow = useLinkConversationToWorkflow();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  
  // Messages from backend
  const { message: welcomeMessage, isLoading: isLoadingWelcome, error: welcomeError } = useReadyWelcomeMessage();
  
  // Local UI state
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SELECTED_MODEL_KEY);
      return stored && Object.values(AIModel).includes(stored as AIModel) 
        ? (stored as AIModel) 
        : DEFAULT_MODEL;
    }
    return DEFAULT_MODEL;
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get current conversation and messages
  const currentConversation = conversations.find(c => c.id === conversationId);
  
  
  // Auto-select first conversation for workflow if none is selected
  // This ensures users don't lose workflow association
  useEffect(() => {
    if (workflowId && conversations.length > 0 && !conversationId) {
      const firstConversation = conversations[0];
      onConversationChange(firstConversation.id);
    }
  }, [workflowId, conversations, conversationId, onConversationChange]);
  
  // Build messages array with backend welcome message
  const messages = React.useMemo(() => {
    const conversationMessages = currentConversation?.messages
      ?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // ✅ BACKUP: Ensure chronological order
      ?.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
        type: (msg.message_type || 'text') as 'text' | 'workflow' | 'error',
        workflowData: msg.workflow_data
      })) || [];
    
    // Always include welcome message at the beginning if we have one
    if (welcomeMessage) {
      return [welcomeMessage, ...conversationMessages];
    }
    
    return conversationMessages;
  }, [currentConversation, welcomeMessage]);

  // Auto-focus input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSending) {
        textareaRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isSending, conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 250);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputValue]);
  
  // HANDLE WORKFLOW CHANGES DURING MESSAGE PROCESSING (Issue #2 Fix)
  const [previousWorkflowId, setPreviousWorkflowId] = useState(workflowId);
  useEffect(() => {
    if (workflowId !== previousWorkflowId) {
      // ✅ FIX: Only handle workflow changes when NOT sending messages
      // Prevent breaking the message flow during active sending
      if (!isSending) {
        // Safe to switch workflows when not actively sending
        toast.info(`Switched to ${workflowId ? 'workflow' : 'new workflow'} context`);
      }
      // Note: If switching during send, let the message complete normally
      // The conversation will be properly associated with the correct workflow
      
      setPreviousWorkflowId(workflowId);
    }
  }, [workflowId, previousWorkflowId, isSending, toast]);

  // Handle model change
  const handleModelChange = useCallback((model: AIModel) => {
    setSelectedModel(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_MODEL_KEY, model);
    }
  }, []);

  // Handle create new conversation - just clear UI, don't create in DB yet
  const handleCreateNewConversation = useCallback(() => {
    // Just clear the conversation selection to show welcome state
    onConversationChange('');
    toast.success('Ready for new conversation');
  }, [onConversationChange, toast]);

  // Auto-select model when models load
  useEffect(() => {
    if (availableModels.length > 0) {
      const currentModelAvailable = availableModels.some(m => m.model_id === selectedModel);
      if (!currentModelAvailable) {
        const defaultModel = availableModels.find(m => m.model_id === AIModel.GEMINI_2_5_FLASH) || availableModels[0];
        handleModelChange(defaultModel.model_id);
      }
    }
  }, [availableModels, selectedModel, handleModelChange]);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    const message = inputValue.trim();
    if (!message || !user || isSending) return;

    let activeConversationId = conversationId;

    // VALIDATION: Ensure conversation and workflow context are consistent
    if (activeConversationId && workflowId && currentConversation) {
      const conversationWorkflowId = currentConversation.workflow_id;
      if (conversationWorkflowId !== workflowId) {
        console.warn('📝 DEBUG - Conversation/workflow mismatch detected:', {
          conversationWorkflowId,
          currentWorkflowId: workflowId,
          conversationId: activeConversationId
        });
        // Clear conversation to force creation of new one for current workflow
        activeConversationId = null;
        onConversationChange('');
      }
    }

    // Create conversation if none exists
    if (!activeConversationId) {
      try {
        const newConversation = await createConversation.mutateAsync({ workflowId: workflowId || undefined });
        activeConversationId = newConversation.id;
        
        // CRITICAL: Ensure the conversation is selected in the UI
        onConversationChange(activeConversationId);
        
        // Small delay to ensure the cache update from conversation creation completes
        // This ensures the conversation appears in the conversation list
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('🔍 DEBUG - Failed to create conversation:', error);
        toast.error('Failed to create conversation');
        return;
      }
    }

    // Clear input immediately - optimistic update will show the message
    setInputValue("");
    
    try {
      const request: ChatRequest = {
        user_message: message,
        conversation_id: activeConversationId,
        workflow_id: workflowId,
        model: selectedModel,
        temperature: 0.3,
        max_tokens: 4000,
      };

      // Send message - React Query optimistic updates handle UI
      const response = await new Promise<any>((resolve, reject) => {
        sendMessage(request, {
          onSuccess: resolve,
          onError: reject,
        });
      });

      // Handle workflow generation/updates in separate try-catch to prevent breaking chat
      if (response.workflow) {
        try {
          if (!workflowId) {
            // NEW WORKFLOW: Create new workflow in database
            const savedWorkflow = await createWorkflow.mutateAsync({
              id: response.workflow.id,
              name: response.workflow.name,
              description: `Generated workflow with ${response.workflow.nodes.length} nodes`,
              workflow_data: response.workflow,
              owner_id: user.id,
              status: 'active',
            });

            // Link conversation to new workflow
            await linkToWorkflow.mutateAsync({
              conversationId: activeConversationId,
              workflowId: savedWorkflow.id,
            });

            // Call workflow generated callback safely
            try {
              onWorkflowGenerated?.(savedWorkflow);
              toast.success(`New workflow "${savedWorkflow.name}" created successfully!`);
            } catch (callbackError) {
              console.warn('Workflow generated callback failed:', callbackError);
              toast.success(`New workflow "${savedWorkflow.name}" created!`);
            }
          } else {
            // EXISTING WORKFLOW: Update existing workflow in database
            const updatedWorkflow = await updateWorkflow.mutateAsync({
              workflowId: workflowId,
              updates: {
                workflow_data: response.workflow,
                updated_at: new Date().toISOString(),
                // Create version history entry if version control system exists
                ...(response.changes_made && {
                  description: `Updated: ${response.changes_made.join(', ')}`,
                }),
              },
            });

            // Call workflow generated callback safely
            try {
              onWorkflowGenerated?.(updatedWorkflow);
              toast.success(`Workflow "${updatedWorkflow.name}" updated successfully!`);
            } catch (callbackError) {
              console.warn('Workflow updated callback failed:', callbackError);
              toast.success(`Workflow "${updatedWorkflow.name}" updated!`);
            }
          }
        } catch (workflowError) {
          // Don't let workflow save errors break the chat - just show warning
          console.error('Failed to save/update workflow:', workflowError);
          const errorMsg = workflowId 
            ? 'Workflow updated but failed to save changes to database' 
            : 'Workflow generated but failed to save to database';
          toast.error(errorMsg);
          // Chat should still work for subsequent messages
        }
      }
    } catch (error) {
      // On error, restore the input (optimistic update already rolled back by React Query)
      setInputValue(message);
      toast.error('Failed to send message');
    }
  }, [inputValue, user, isSending, conversationId, workflowId, selectedModel, createConversation, sendMessage, createWorkflow, updateWorkflow, linkToWorkflow, onConversationChange, onWorkflowGenerated, toast]);

  // Show auth required if no user
  if (!user) {
    return <AuthRequired onClose={onClose} />;
  }

  const selectedModelInfo = availableModels.find(m => m.model_id === selectedModel);

  return (
    <div className="w-96 h-full bg-black/80 border-l border-white/10 flex flex-col overflow-hidden">
      <ChatHeader 
        selectedModelName={selectedModelInfo?.name}
        onClose={onClose}
        onModelChange={handleModelChange}
        selectedModel={selectedModel}
        isGenerating={isSending}
      />

      {modelsError && <ModelsError error={modelsError.message || String(modelsError)} />}

      <div className="flex-1 overflow-hidden">
        <MessagesArea 
          messages={messages}
          isGenerating={isSending}
          messagesEndRef={messagesEndRef}
          workflowProgress={isSending ? 'Processing your request...' : ''}
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
        onModelChange={handleModelChange}
      />
      
      <ConversationHistoryAccordion
        conversations={conversations}
        activeConversationId={conversationId}
        workflowId={workflowId}
        onConversationSelect={onConversationChange}
        onCreateNew={handleCreateNewConversation}
      />
    </div>
  );
}
