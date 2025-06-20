"use client";

import { ArrowUp, Loader2 } from "lucide-react";
import { AIModel } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "./ModelSelector";

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleSendMessage: () => void;
  isGenerating: boolean;
  availableModels: any[];
  selectedModel: AIModel;
  modelsLoading: boolean;
  onModelChange: (model: AIModel) => void;
}

export function ChatInput({ 
  inputValue, 
  setInputValue, 
  textareaRef, 
  handleSendMessage, 
  isGenerating, 
  availableModels, 
  selectedModel, 
  modelsLoading, 
  onModelChange 
}: ChatInputProps) {
  return (
    <div className="p-6">
      <div className="relative">
        <div className="relative flex items-end gap-2 p-3 bg-background border rounded-2xl focus-within:ring-2 focus-within:ring-ring">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Describe your workflow or ask anything..."
            disabled={isGenerating || availableModels.length === 0}
            className="min-h-[60px] max-h-[120px] resize-none border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin"
            rows={1}
          />
          
          <div className="flex items-end gap-2 pb-2">
            <ModelSelector
              selectedModel={selectedModel}
              availableModels={availableModels}
              modelsLoading={modelsLoading}
              isGenerating={isGenerating}
              onModelChange={onModelChange}
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isGenerating || availableModels.length === 0}
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title={inputValue.trim() ? "Send message or generate workflow" : "Type a message to generate"}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                  <ArrowUp className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}