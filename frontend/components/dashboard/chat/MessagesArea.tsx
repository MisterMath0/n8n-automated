"use client";

import { AnimatePresence } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { LoadingMessage } from "./LoadingMessage";
import { Message } from "./types";

interface MessagesAreaProps {
  messages: Message[];
  isGenerating: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessagesArea({ messages, isGenerating, messagesEndRef }: MessagesAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <AnimatePresence>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </AnimatePresence>

      {isGenerating && <LoadingMessage />}

      <div ref={messagesEndRef} />
    </div>
  );
}