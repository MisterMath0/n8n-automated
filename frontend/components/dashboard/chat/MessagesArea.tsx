"use client";

import { MessageBubble } from "./MessageBubble";
import { Message } from "./types";

interface MessagesAreaProps {
  messages: Message[];
  isGenerating: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  workflowProgress?: string;
}

export function MessagesArea({ messages, messagesEndRef }: MessagesAreaProps) {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
