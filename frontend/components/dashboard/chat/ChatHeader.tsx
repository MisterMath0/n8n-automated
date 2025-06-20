"use client";

import { Bot, X } from "lucide-react";
import { AIModel } from "@/types/api";
import { ModelSelector } from "./ModelSelector";
import { useModels } from "@/hooks/api";

interface ChatHeaderProps {
  selectedModelName?: string;
  onClose: () => void;
  onModelChange?: (model: AIModel) => void;
  selectedModel: AIModel;
  isGenerating?: boolean;
}

export function ChatHeader({ 
  selectedModelName, 
  onClose, 
  onModelChange,
  selectedModel,
  isGenerating = false
}: ChatHeaderProps) {
  const { models, loading: modelsLoading } = useModels();

  return (
    <div>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">AI Assistant</span>
            {selectedModelName && (
              <div className="text-xs text-gray-400">
                {selectedModelName}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector
            selectedModel={selectedModel}
            availableModels={models}
            modelsLoading={modelsLoading}
            isGenerating={isGenerating}
            onModelChange={onModelChange || (() => {})}
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
