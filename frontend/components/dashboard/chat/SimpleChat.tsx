"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWorkflowGeneration, useModels } from "@/hooks/api";
import { useToast } from "@/components/providers";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { AIModel, WorkflowGenerationRequest } from "@/types/api";
import { ChatHeader } from "./ChatHeader";
import { ModelsError } from "./ModelsError";
import { ChatInput } from "./ChatInput";
import { MessagesArea } from "./MessagesArea";
import { Message, SimpleChatProps } from "@/components/dashboard/chat/types";
import { welcomeMessage, MODEL_NAME_TO_ENUM } from "@/components/dashboard/chat/constants";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function SimpleChat({ onClose, onWorkflowGenerated }: SimpleChatProps) {
  const { user } = useAuth();
  const { generateWorkflow, isGenerating } = useWorkflowGeneration();
  const { models, loading: modelsLoading, error: modelsError } = useModels();
  const { currentConversation, setCurrentConversation, createConversation, addMessage, getContextMessages } = useConversations();
  const toast = useToast();
  
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>(AIModel.CLAUDE_4_SONNET);
  const [maxContextTokens, setMaxContextTokens] = useState(8000);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const availableModels = models.filter(model => MODEL_NAME_TO_ENUM[model.name]);
  
  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // Initialize conversation when user is available
  useEffect(() => {
    const initConversation = async () => {
      if (user && !currentConversation) {
        try {
          const conversation = await createConversation(
            undefined,
            'New Workflow Chat',
            maxContextTokens
          );
          if (conversation) {
            setCurrentConversation(conversation);
          }
        } catch (error) {
          console.error('Failed to create conversation:', error);
        }
      }
    };

    initConversation();
  }, [user, currentConversation, createConversation, setCurrentConversation, maxContextTokens]);

  // Auto-select first available model when models load
  useEffect(() => {
    if (availableModels.length > 0 && !getSelectedModelInfo()) {
      const firstAvailable = MODEL_NAME_TO_ENUM[availableModels[0].name];
      if (firstAvailable) {
        setSelectedModel(firstAvailable);
      }
    }
  }, [availableModels, models, modelsLoading, selectedModel]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating || !user || !currentConversation) return;

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
        currentConversation.id,
        description,
        'user',
        'text',
        undefined,
        userTokens
      );

      // Get context messages within token limit
      const contextMessages = getContextMessages(currentConversation, maxContextTokens);
      
      console.log('🔍 [DEBUG] Context management:', {
        totalMessages: currentConversation.messages.length,
        contextMessages: contextMessages.length,
        maxTokens: maxContextTokens,
        currentTotalTokens: currentConversation.total_tokens
      });

      const request: WorkflowGenerationRequest = {
        description: description,
        model: selectedModel,
        temperature: 0.3,
        max_tokens: 4000,
      };

      const response = await generateWorkflow(request);
      
      if (response.success && response.workflow) {
        const assistantTokens = estimateTokens(response.workflow.name + JSON.stringify(response.workflow.nodes));
        
        const workflowMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Generated workflow "${response.workflow.name}" with ${response.workflow.nodes.length} nodes in ${response.generation_time.toFixed(2)}s using ${response.tokens_used || 'N/A'} tokens.`,
          sender: 'ai',
          type: 'workflow',
          workflowData: response.workflow
        };

        setMessages(prev => [...prev, workflowMessage]);
        
        // Save assistant message to database
        await addMessage(
          currentConversation.id,
          workflowMessage.content,
          'assistant',
          'workflow',
          response.workflow,
          assistantTokens
        );

        onWorkflowGenerated?.(response.workflow);
        
        if (response.warnings.length > 0) {
          response.warnings.forEach(warning => toast.warning(warning));
        }
      }
    } catch (error) {
      console.error('🔍 [DEBUG] Workflow generation failed:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error generating that workflow. Please try again.',
        sender: 'ai',
        type: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message to database
      if (currentConversation) {
        await addMessage(
          currentConversation.id,
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
    <div className="w-96 h-full bg-black/80 border-l border-white/10 flex flex-col">
      <ChatHeader 
        selectedModelName={getSelectedModelInfo()?.name}
        onClose={onClose}
        maxContextTokens={maxContextTokens}
        onMaxContextTokensChange={setMaxContextTokens}
      />

      {modelsError && <ModelsError error={modelsError} />}

      <MessagesArea 
        messages={messages}
        isGenerating={isGenerating}
        messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
      />

      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
        handleSendMessage={handleSendMessage}
        isGenerating={isGenerating}
        availableModels={availableModels}
        selectedModel={selectedModel}
        modelsLoading={modelsLoading}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}