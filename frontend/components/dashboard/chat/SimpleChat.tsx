"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWorkflowGeneration, useModels } from "@/hooks/api";
import { useToast } from "@/components/providers";
import { AIModel, WorkflowGenerationRequest } from "@/types/api";
import { ChatHeader } from "./ChatHeader";
import { ModelsError } from "./ModelsError";
import { ChatInput } from "./ChatInput";
import { MessagesArea } from "./MessagesArea";
import { Message, SimpleChatProps } from "@/components/dashboard/chat/types";
import { welcomeMessage, MODEL_NAME_TO_ENUM } from "@/components/dashboard/chat/constants";

export function SimpleChat({ onClose, onWorkflowGenerated }: SimpleChatProps) {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>(AIModel.CLAUDE_4_SONNET);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { generateWorkflow, isGenerating } = useWorkflowGeneration();
  const { models, loading: modelsLoading, error: modelsError } = useModels();
  const toast = useToast();

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

  // Auto-select first available model when models load
  useEffect(() => {
    if (availableModels.length > 0 && !getSelectedModelInfo()) {
      const firstAvailable = MODEL_NAME_TO_ENUM[availableModels[0].name];
      if (firstAvailable) {
        console.log('🔍 [DEBUG] Auto-selecting first available model:', {
          from: selectedModel,
          to: firstAvailable,
          modelName: availableModels[0].name
        });
        setSelectedModel(firstAvailable);
      }
    }
  }, [availableModels, models, modelsLoading, selectedModel]);

  useEffect(() => {
      adjustTextareaHeight();
    }, [inputValue, adjustTextareaHeight]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const description = inputValue.trim();

    // 🔍 DEBUG: Log all request details before sending
    console.log('🔍 [DEBUG] Sending message request:', {
      timestamp: new Date().toISOString(),
      input: {
        description: description,
        length: description.length,
        originalInput: inputValue,
        trimmedLength: description.length
      },
      modelSelection: {
        selectedModel,
        selectedModelName: getSelectedModelInfo()?.name,
        selectedModelProvider: getSelectedModelInfo()?.provider,
        hasValidModelInfo: !!getSelectedModelInfo(),
        availableModelsCount: availableModels.length,
        totalModelsCount: models.length
      },
      requestParameters: {
        temperature: 0.3,
        max_tokens: 4000
      },
      validation: {
        hasSelectedModel: !!selectedModel,
        modelInAvailableList: availableModels.some(m => MODEL_NAME_TO_ENUM[m.name] === selectedModel)
      }
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      content: description,
      sender: 'user',
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = description;
    setInputValue("");

    try {
      const request: WorkflowGenerationRequest = {
        description: currentInput,
        model: selectedModel,
        temperature: 0.3,
        max_tokens: 4000,
      };

      // 🔍 DEBUG: Log exact request payload
      console.log('🔍 [DEBUG] Exact request payload:', {
        request,
        requestStringified: JSON.stringify(request, null, 2),
        modelValueType: typeof selectedModel,
        modelValue: selectedModel,
        descriptionType: typeof currentInput,
        descriptionValue: currentInput
      });

      const response = await generateWorkflow(request);
      
      // 🔍 DEBUG: Log successful response
      console.log('🔍 [DEBUG] Workflow generation successful:', {
        success: response.success,
        modelUsed: response.model_used,
        generationTime: response.generation_time,
        tokensUsed: response.tokens_used,
        hasWorkflow: !!response.workflow,
        warningsCount: response.warnings?.length || 0
      });
      
      if (response.success && response.workflow) {
        const workflowMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Generated workflow "${response.workflow.name}" with ${response.workflow.nodes.length} nodes in ${response.generation_time.toFixed(2)}s using ${response.tokens_used || 'N/A'} tokens.`,
          sender: 'ai',
          type: 'workflow',
          workflowData: response.workflow
        };

        setMessages(prev => [...prev, workflowMessage]);
        onWorkflowGenerated?.(response.workflow);
        
        if (response.warnings.length > 0) {
          response.warnings.forEach(warning => toast.warning(warning));
        }
      }
    } catch (error) {
      // 🔍 DEBUG: Log detailed error information
      console.error('🔍 [DEBUG] Workflow generation failed:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
        timestamp: new Date().toISOString(),
        lastRequestDetails: {
          description: currentInput,
          model: selectedModel,
          selectedModelInfo: getSelectedModelInfo()
        }
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error generating that workflow. Please check the console and try again.',
        sender: 'ai',
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <div className="w-96 h-full bg-black/80 border-l border-white/10 flex flex-col">
      <ChatHeader 
        selectedModelName={getSelectedModelInfo()?.name}
        onClose={onClose}
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