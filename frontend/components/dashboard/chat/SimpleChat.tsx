"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useModels, useChatWithAI } from "@/hooks/api";
import { useToast } from "@/components/providers";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { AIModel, ChatRequest, ChatResponse } from "@/types/api";
import { ChatHeader } from "./ChatHeader";
import { ModelsError } from "./ModelsError";
import { ChatInput } from "./ChatInput";
import { MessagesArea } from "./MessagesArea";
import { Message, SimpleChatProps } from "@/components/dashboard/chat/types";
import { welcomeMessage, MODEL_NAME_TO_ENUM, DEFAULT_MODEL, SELECTED_MODEL_KEY } from "@/components/dashboard/chat/constants";

function generateUUID(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function SimpleChat({ onClose, onWorkflowGenerated }: SimpleChatProps) {
  const { user } = useAuth();
  const { models, loading: modelsLoading, error: modelsError } = useModels();
  const { currentConversation, setCurrentConversation, refetch } = useConversations();
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
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation messages when conversation changes
  useEffect(() => {
    if (currentConversation?.messages && currentConversation.messages.length > 0) {
      const conversationMessages = currentConversation.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'ai' as 'user' | 'ai',
        type: msg.message_type as 'text' | 'workflow' | 'error',
        workflowData: msg.workflow_data
      }));
      
      setMessages([welcomeMessage, ...conversationMessages]);
    } else {
      setMessages([welcomeMessage]);
    }
  }, [currentConversation]);

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

    const description = inputValue.trim();
    const userTokens = estimateTokens(description);

    // Generate conversation ID if we don't have one
    let conversationId = currentConversation?.id;
    if (!conversationId) {
      // Generate a new UUID for the conversation
      conversationId = generateUUID();
    }

    // Enhanced user message with better UX
    const userMessage: Message = {
      id: Date.now().toString(),
      content: description,
      sender: 'user',
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoadingWorkflow(true);
    setWorkflowProgress('Processing your request...');

    try {
      setWorkflowProgress('Analyzing your requirements...');

      const request: ChatRequest = {
        user_message: description,
        conversation_id: conversationId,
        model: selectedModel,
        temperature: 0.3,
        max_tokens: 4000,
      };

      setWorkflowProgress('Generating AI response...');
      const response: ChatResponse = await chatWithAI(request);

      // If this was a new conversation, refresh to load the newly created one
      if (!currentConversation) {
        setTimeout(async () => {
          await refetch();
        }, 500);
      }

      // Always show the main AI message with enhanced formatting
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'ai',
        type: 'text'
      };
      setMessages(prev => [...prev, aiMessage]);

      // Enhanced workflow handling with progress updates
      if (response.workflow) {
        setWorkflowProgress('Generating workflow visualization...');
        
        const workflowMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `🎯 Generated workflow "${response.workflow.name}" with ${response.workflow.nodes.length} nodes`,
          sender: 'ai',
          type: 'workflow',
          workflowData: response.workflow
        };
        setMessages(prev => [...prev, workflowMessage]);
        onWorkflowGenerated?.(response.workflow);
      }

      // Enhanced search results handling
      if (response.search_results && response.search_results.length > 0) {
        setWorkflowProgress('Processing documentation results...');
        
        const searchContent = `📚 Found ${response.search_results.length} relevant documentation results:\n\n` +
          response.search_results.map((r: any, i: number) => 
            `${i + 1}. **${r.title}**\n${r.content}\n${r.url ? `🔗 ${r.url}` : ''}`
          ).join('\n\n');
        
        const searchMessage: Message = {
          id: (Date.now() + 3).toString(),
          content: searchContent,
          sender: 'ai',
          type: 'text'
        };
        setMessages(prev => [...prev, searchMessage]);
      }

      // Tool usage info (minimal)
      if (response.tools_used && response.tools_used.length > 0) {
        console.log('Tools used:', response.tools_used.join(', '));
      }

    } catch (error) {
      console.error('🔍 [Enhanced DEBUG] Chat failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 10).toString(),
        content: '❌ Sorry, I encountered an error processing your request. Please try again.',
        sender: 'ai',
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process request');
    } finally {
      setIsLoadingWorkflow(false);
      setWorkflowProgress('');
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
          isGenerating={isChatting || isLoadingWorkflow}
          messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
          workflowProgress={workflowProgress}
        />
      </div>

      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
        handleSendMessage={handleSendMessage}
        isGenerating={isChatting || isLoadingWorkflow}
        availableModels={availableModels}
        selectedModel={selectedModel}
        modelsLoading={modelsLoading}
        onModelChange={handleModelChange}
      />
    </div>
  );
}