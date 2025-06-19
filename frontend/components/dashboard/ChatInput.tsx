"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message?: string) => void;
  disabled: boolean;
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  ({ value, onChange, onSend, disabled }, ref) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    };

    return (
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={ref}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe the workflow you want to create..."
              disabled={disabled}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-green-400/50 focus:outline-none focus:ring-1 focus:ring-green-400/20 transition-all text-sm disabled:opacity-50"
            />
          </div>
          <motion.button
            onClick={() => onSend()}
            disabled={!value.trim() || disabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disabled ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
        
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <Sparkles className="w-3 h-3" />
          <span>AI can make mistakes. Verify important workflows.</span>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';
