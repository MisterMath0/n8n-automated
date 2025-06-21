"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare, Plus } from "lucide-react";

interface ConversationHistoryAccordionProps {
  conversations: any[];
  activeConversationId: string | null;
  workflowId: string | null;
  onConversationSelect: (conversationId: string) => void;
  onCreateNew: () => void;
}

export function ConversationHistoryAccordion({
  conversations,
  activeConversationId,
  workflowId,
  onConversationSelect,
  onCreateNew
}: ConversationHistoryAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter and sort conversations
  const sortedConversations = React.useMemo(() => {
    return [...conversations]
      .filter(conv => workflowId ? conv.workflow_id === workflowId : !conv.workflow_id)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [conversations, workflowId]);

  const getConversationTitle = (conversation: any) => {
    const firstUserMessage = conversation.messages?.find((msg: any) => msg.role === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content.trim();
      return content.length > 30 ? content.substring(0, 30) + "..." : content;
    }
    return "New Conversation";
  };

  return (
    <div className="w-full border-t border-white/10 bg-black/50">
      {/* Accordion Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 flex items-center justify-between text-xs text-white/60 hover:text-white/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3 h-3" />
          <span>
            {workflowId ? "Workflow Conversations" : "New Workflow Conversations"} ({sortedConversations.length})
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="border-t border-white/5 bg-black/30 max-h-48 overflow-y-auto">
          {/* Create New Conversation Button */}
          <button
            onClick={onCreateNew}
            className="w-full p-2 text-xs text-left hover:bg-white/5 transition-colors border-b border-white/5 flex items-center gap-2"
          >
            <Plus className="w-3 h-3 text-green-400" />
            <span className="text-green-400">Create New Conversation</span>
          </button>

          {/* Conversation List */}
          {sortedConversations.length === 0 ? (
            <div className="p-3 text-xs text-white/40 text-center">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-0">
              {sortedConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={`w-full p-2 text-xs text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 ${
                    activeConversationId === conversation.id 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'text-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">
                        {getConversationTitle(conversation)}
                      </div>
                      <div className="text-white/40 mt-0.5">
                        {conversation.messages?.length || 0} messages
                      </div>
                    </div>
                    <div className="text-white/30 ml-2 text-xs">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
