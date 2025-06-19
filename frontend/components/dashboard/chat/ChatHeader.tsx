"use client";

import { Bot, X } from "lucide-react";

interface ChatHeaderProps {
  selectedModelName?: string;
  onClose: () => void;
}

export function ChatHeader({ selectedModelName, onClose }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-medium">AI Assistant</span>
          {selectedModelName && (
            <div className="text-xs text-gray-400">
              {selectedModelName}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1 text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}