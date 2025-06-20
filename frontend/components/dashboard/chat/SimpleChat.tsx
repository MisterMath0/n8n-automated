"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWorkflowGeneration, useModels, useChatWithAI } from "@/hooks/api";
import { useToast } from "@/components/providers";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { AIModel, WorkflowGenerationRequest, ChatMessage, ChatRequest, ChatResponse } from "@/types/api";
import { ChatHeader } from "./ChatHeader";
import { ModelsError } from "./ModelsError";
import { ChatInput } from "./ChatInput";
import { MessagesArea } from "./MessagesArea";
import { Message, SimpleChatProps } from "@/components/dashboard/chat/types";
import { welcomeMessage, MODEL_NAME_TO_ENUM, DEFAULT_MODEL, SELECTED_MODEL_KEY } from "@/components/dashboard/chat/constants";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function SimpleChat({ onClose, onWorkflowGenerated }: SimpleChatProps) {
  const { user } = useAuth();
  const { generateWorkflow, isGenerating } = useWorkflowGeneration();
  const { models, loading: modelsLoading, error: modelsError } = useModels();
  const { currentConversation, setCurrentConversation, createConversation, addMessage } = useConversations();
  const toast = useToast();
  const { chatWithAI, isChatting } = useChatWithAI();
  
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SELECTED_MODEL_KEY);
      return stored ? (stored as AIModel) : DEFAULT_MODEL;
    }
    return DEFAULT_MODEL;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const availableModels = models.filter(model => 
    Object.values(AIModel).includes(model.model_id)
  );
  
  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  // Persist model selection
  const handleModelChange = (model: AIModel) => {
    setSelectedModel(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_MODEL_KEY, model);
    }
  };

  // Auto-select first available model when models load
  useEffect(() => {
    if (availableModels.length > 0) {
      // Check if current selected model is available
      const currentModelAvailable = availableModels.some(m => m.model_id === selectedModel);
      if (!currentModelAvailable) {
        // Try to find Gemini model first
        const geminiModel = availableModels.find(m => m.model_id === AIModel.GEMINI_2_5_FLASH);
        if (geminiModel) {
          handleModelChange(geminiModel.model_id);
        } else {
          // Fall back to first available model
          handleModelChange(availableModels[0].model_id);
        }
      }
    }
  }, [availableModels, selectedModel]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isChatting || !user) return;

    let conversation = currentConversation;
    if (!conversation) {
      const newConversation = await createConversation();
      if (newConversation) {
        conversation = newConversation;
        setCurrentConversation(newConversation);
      } else {
        toast.error("Could not start a new conversation. Please try again.");
        return;
      }
    }

    const description = inputValue.trim();
    const userTokens = estimateTokens(description);

    // Add user message to local state and database
    const userMessage: Message = {
      id: Date.now().toString(),
      content: description,
      sender: 'user',
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
      // Save user message to database
      await addMessage(
        conversation.id,
        description,
        'user',
        'text',
        undefined,
        userTokens
      );

      const request: ChatRequest = {
        user_message: description,
        conversation_id: conversation.id,
        model: selectedModel,
        temperature: 0.3,
        max_tokens: 4000,
      };

      const response: ChatResponse = await chatWithAI(request);

      // Always show the main AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'ai',
        type: 'text'
      };
      setMessages(prev => [...prev, aiMessage]);
      await addMessage(
        conversation.id,
        response.message,
        'assistant',
        'text',
        undefined,
        estimateTokens(response.message)
      );

      // If workflow is present, show it
      if (response.workflow) {
        const workflowMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `Generated workflow "${response.workflow.name}" with ${response.workflow.nodes.length} nodes in ${response.generation_time.toFixed(2)}s.`,
          sender: 'ai',
          type: 'workflow',
          workflowData: response.workflow
        };
        setMessages(prev => [...prev, workflowMessage]);
        await addMessage(
          conversation.id,
          workflowMessage.content,
          'assistant',
          'workflow',
          response.workflow,
          estimateTokens(workflowMessage.content)
        );
        onWorkflowGenerated?.(response.workflow);
      }

      // If search_results are present, show them as a single message
      if (response.search_results && response.search_results.length > 0) {
        const searchContent = response.search_results.map((r: any, i: number) => `Result ${i + 1}: ${r.title}\n${r.content}\n${r.url ? r.url : ''}`).join('\n\n');
        const searchMessage: Message = {
          id: (Date.now() + 3).toString(),
          content: searchContent,
          sender: 'ai',
          type: 'text'
        };
        setMessages(prev => [...prev, searchMessage]);
        await addMessage(
          conversation.id,
          searchContent,
          'assistant',
          'text',
          undefined,
          estimateTokens(searchContent)
        );
      }
    } catch (error) {
      console.error('🔍 [DEBUG] Chat failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 10).toString(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'ai',
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      if (conversation) {
        await addMessage(
          conversation.id,
          errorMessage.content,
          'assistant',
          'error',
          undefined,
          estimateTokens(errorMessage.content)
        );
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSelectedModelInfo = () => {
    return models.find(model => MODEL_NAME_TO_ENUM[model.name] === selectedModel);
  };

  // Show auth required message if user is not authenticated
  if (!user) {
    return (
      <div className="w-96 h-full bg-black/80 border-l border-white/10 flex flex-col items-center justify-center">
        <div className="text-center p-6">
          <h3 className="text-white text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-400 text-sm mb-4">
            Please sign in to start generating workflows and save your conversation history.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 h-full bg-black/80 border-l border-white/10 flex flex-col overflow-hidden">
      <ChatHeader 
        selectedModelName={getSelectedModelInfo()?.name}
        onClose={onClose}
        onModelChange={handleModelChange}
        selectedModel={selectedModel}
        isGenerating={isChatting}
      />

      {modelsError && <ModelsError error={modelsError} />}

      <div className="flex-1 overflow-hidden">
        <MessagesArea 
          messages={messages}
          isGenerating={isChatting}
          messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
        />
      </div>

      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
        handleSendMessage={handleSendMessage}
        isGenerating={isChatting}
        availableModels={availableModels}
        selectedModel={selectedModel}
        modelsLoading={modelsLoading}
        onModelChange={handleModelChange}
      />
    </div>
  );
}