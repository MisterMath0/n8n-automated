"use client";

import { MessageBubble } from "./MessageBubble";
import { LoadingMessage } from "./LoadingMessage";
import { Message } from "./types";

interface MessagesAreaProps {
  messages: Message[];
  isGenerating: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  workflowProgress?: string;
}

export function MessagesArea({ 
  messages, 
  isGenerating, 
  messagesEndRef, 
  workflowProgress 
}: MessagesAreaProps) {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {/* Render all messages */}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Show loading message when generating and no streaming message */}
      {isGenerating && !messages.some(m => m.isStreaming) && (
        <LoadingMessage 
          isGenerating={isGenerating}
          progress={workflowProgress}
        />
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
