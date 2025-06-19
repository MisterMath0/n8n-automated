"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, Loader2, Sparkles, Settings } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { ChatInput } from "./ChatInput";
import { ModelSelector } from "@/components/features/model-selection";
import { useWorkflowGeneration, useModels } from "@/hooks/api";
import { useToast } from "@/components/providers";
import { AIModel, WorkflowGenerationRequest } from "@/types/api";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'workflow' | 'error';
  workflowData?: any;
}

interface AIChatProps {
  onClose: () => void;
  onWorkflowGenerated?: (workflow: any) => void;
}

const welcomeMessage: Message = {
  id: '1',
  content: "Hi! I'm your AI workflow assistant. Describe any automation you want to create and I'll generate a complete n8n workflow for you.",
  sender: 'ai',
  timestamp: new Date(),
  type: 'text'
};

export function AIChat({ onClose, onWorkflowGenerated }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>(AIModel.CLAUDE_4_SONNET);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { generateWorkflow, isGenerating, error: apiError } = useWorkflowGeneration();
  const { models } = useModels();
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string = inputValue) => {
    if (!message.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
      const request: WorkflowGenerationRequest = {
        description: message,
        model: selectedModel,
        temperature: 0.3,
        max_tokens: 4000,
      };

      const response = await generateWorkflow(request);
      
      if (response.success && response.workflow) {
        const workflowMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Great! I've generated a workflow for "${message}" using ${response.model_used}. Generation took ${response.generation_time.toFixed(2)}s and used ${response.tokens_used || 'N/A'} tokens. You can see it in the main canvas and export it as n8n JSON when ready.`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'workflow',
          workflowData: response.workflow
        };

        setMessages(prev => [...prev, workflowMessage]);
        
        // Notify parent component
        onWorkflowGenerated?.(response.workflow);
        
        // Show warnings if any
        if (response.warnings.length > 0) {
          response.warnings.forEach(warning => {
            toast.warning(warning);
          });
        }
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error generating that workflow. Please try again with a different description.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.handleApiError(error, 'Failed to generate workflow');
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="w-96 h-full bg-black/80 border-l border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">AI Assistant</h3>
              <p className="text-xs text-gray-400">Workflow Generator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Selection */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">AI Model:</span>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={isGenerating}
            compact
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating workflow...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length === 1 && (
        <SuggestedPrompts onSelectPrompt={handleSuggestedPrompt} />
      )}

      {/* Input */}
      <ChatInput
        ref={inputRef}
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        disabled={isGenerating}
      />
    </div>
  );
}
