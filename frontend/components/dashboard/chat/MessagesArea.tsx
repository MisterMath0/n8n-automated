"use client";

import { AnimatePresence } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { LoadingMessage } from "./LoadingMessage";
import { ProgressIndicator } from "./ProgressIndicator";
import { Message } from "./types";

interface MessagesAreaProps {
  messages: Message[];
  isGenerating: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  workflowProgress?: string;
}

export function MessagesArea({ messages, isGenerating, messagesEndRef, workflowProgress }: MessagesAreaProps) {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <AnimatePresence>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </AnimatePresence>

      {isGenerating && (
        workflowProgress ? (
          <ProgressIndicator message={workflowProgress} />
        ) : (
          <LoadingMessage />
        )
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}