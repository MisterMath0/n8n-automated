"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { Message } from "./types";
import { MarkdownFormatter } from "./MarkdownFormatter";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}
    >
      <div className={`max-w-[80%] min-w-0 rounded-2xl p-3 overflow-hidden ${
        isUser
          ? 'bg-green-600 text-white' 
          : message.type === 'error'
            ? 'bg-red-500/20 border border-red-500/30 text-red-300'
            : message.type === 'workflow'
              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
              : 'bg-white/5 border border-white/10 text-gray-300'
      }`}>
        <MarkdownFormatter 
          content={message.content}
          isUser={isUser}
          className="text-xs"
        />
      </div>
    </motion.div>
  );
}