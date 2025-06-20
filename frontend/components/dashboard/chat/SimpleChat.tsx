"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useModels } from "@/hooks/api";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { AIModel } from "@/types/api";
import { ChatHeader } from "./ChatHeader";
import { ModelsError } from "./ModelsError";
import { ChatInput } from "./ChatInput";
import { MessagesArea } from "./MessagesArea";
import { Message, SimpleChatProps } from "./types";
import { welcomeMessage, DEFAULT_MODEL, SELECTED_MODEL_KEY } from "./constants";
import { AuthRequired } from "./components/AuthRequired";
import { useMessageLoader } from "./hooks/useMessageLoader";
import { useMessageHandler } from "./hooks/useMessageHandler";

export function SimpleChat({ onClose, onWorkflowGenerated }: SimpleChatProps) {
  const { user } = useAuth();
  const { models, loading: modelsLoading, error: modelsError } = useModels();
  const { currentConversation } = useConversations();
  
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
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

  // Load messages when conversation changes
  useMessageLoader({ currentConversation, setMessages });

  // Message handler
  const { sendMessage, isProcessing, workflowProgress, isChatting } = useMessageHandler({
    selectedModel,
    onWorkflowGenerated
  });

  // Available models
  const availableModels = models.filter(model => 
    Object.values(AIModel).includes(model.model_id)
  );

  // Auto-focus input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isChatting && !isProcessing) {
        textareaRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isChatting, isProcessing, currentConversation]);

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
    if (!message || !user) return;

    setInputValue("");
    const success = await sendMessage(message, messages, setMessages);
    
    if (!success) {
      setInputValue(message); // Restore input on error
    }
  }, [inputValue, user, sendMessage, messages]);

  // Show auth required if no user
  if (!user) {
    return <AuthRequired onClose={onClose} />;
  }

  const selectedModelInfo = models.find(m => m.model_id === selectedModel);

  return (
    <div className="w-96 h-full bg-black/80 border-l border-white/10 flex flex-col overflow-hidden">
      <ChatHeader 
        selectedModelName={selectedModelInfo?.name}
        onClose={onClose}
        onModelChange={handleModelChange}
        selectedModel={selectedModel}
        isGenerating={isChatting || isProcessing}
      />

      {modelsError && <ModelsError error={modelsError} />}

      <div className="flex-1 overflow-hidden">
        <MessagesArea 
          messages={messages}
          isGenerating={isChatting || isProcessing}
          messagesEndRef={messagesEndRef}
          workflowProgress={workflowProgress}
        />
      </div>

      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        textareaRef={textareaRef}
        handleSendMessage={handleSendMessage}
        isGenerating={isChatting || isProcessing}
        availableModels={availableModels}
        selectedModel={selectedModel}
        modelsLoading={modelsLoading}
        onModelChange={handleModelChange}
      />
    </div>
  );
}
