"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChat, useCreateConversation, useLinkConversationToWorkflow, useCreateWorkflow } from "@/hooks/data";
import { AIModel, ChatRequest } from "@/types/api";
import { ChatHeader } from "./ChatHeader";
import { ModelsError } from "./ModelsError";
import { ChatInput } from "./ChatInput";
import { MessagesArea } from "./MessagesArea";
import { Message } from "./types";
import { welcomeMessage, DEFAULT_MODEL, SELECTED_MODEL_KEY } from "../../../types/constants";
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
  const messages = currentConversation?.messages 
    ? [welcomeMessage, ...currentConversation.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
        type: (msg.message_type || 'text') as 'text' | 'workflow' | 'error',
        workflowData: msg.workflow_data
      }))]
    : [welcomeMessage];

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

  // Handle model change
  const handleModelChange = useCallback((model: AIModel) => {
    setSelectedModel(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_MODEL_KEY, model);
    }
  }, []);

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

    // Create conversation if none exists
    if (!activeConversationId) {
      try {
        const newConversation = await createConversation.mutateAsync({ workflowId: workflowId || undefined });
        activeConversationId = newConversation.id;
        onConversationChange(activeConversationId);
      } catch (error) {
        toast.error('Failed to create conversation');
        return;
      }
    }

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

      const response = await new Promise<any>((resolve, reject) => {
        sendMessage(request, {
          onSuccess: resolve,
          onError: reject,
        });
      });

      // Handle workflow generation
      if (response.workflow && !workflowId) {
        try {
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

          onWorkflowGenerated?.(savedWorkflow);
        } catch (error) {
          console.error('Failed to save workflow:', error);
          toast.error('Workflow generated but failed to save');
        }
      }
    } catch (error) {
      setInputValue(message); // Restore input on error
      toast.error('Failed to send message');
    }
  }, [inputValue, user, isSending, conversationId, workflowId, selectedModel, createConversation, sendMessage, createWorkflow, linkToWorkflow, onConversationChange, onWorkflowGenerated, toast]);

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
    </div>
  );
}
