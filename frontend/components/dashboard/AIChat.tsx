"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, Loader2, Sparkles } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { ChatInput } from "./ChatInput";

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
  onGenerateWorkflow: (prompt: string) => Promise<any>;
  isGenerating: boolean;
}

const welcomeMessage: Message = {
  id: '1',
  content: "Hi! I'm your AI workflow assistant. Describe any automation you want to create and I'll generate a complete n8n workflow for you.",
  sender: 'ai',
  timestamp: new Date(),
  type: 'text'
};

export function AIChat({ onClose, onGenerateWorkflow, isGenerating }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      const workflow = await onGenerateWorkflow(message);
      
      const workflowMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Great! I've generated a workflow for "${message}". You can see it in the main canvas and export it as n8n JSON when ready.`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'workflow',
        workflowData: workflow
      };

      setMessages(prev => [...prev, workflowMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error generating that workflow. Please try again with a different description.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="w-96 h-full bg-black/80 border-l border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
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
