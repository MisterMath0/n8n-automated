"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { Message } from "./types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}
    >
      {message.sender === 'assistant' && (
        <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-3 h-3 text-white" />
        </div>
      )}
      
      <div className={`max-w-[80%] rounded-2xl p-3 ${
        message.sender === 'user' 
          ? 'bg-green-600 text-white' 
          : message.type === 'error'
            ? 'bg-red-500/20 border border-red-500/30 text-red-300'
            : message.type === 'workflow'
              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
              : 'bg-white/5 border border-white/10 text-gray-300'
      }`}>
        <div className="prose text-sm prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>

    </motion.div>
  );
}