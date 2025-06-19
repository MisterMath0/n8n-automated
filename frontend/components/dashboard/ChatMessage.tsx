"use client";

import { motion } from "framer-motion";
import { Bot, User, Download, Code, Wand2, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'workflow' | 'error';
  workflowData?: any;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const handleExport = () => {
    if (!message.workflowData) return;
    
    const blob = new Blob([JSON.stringify(message.workflowData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMessageIcon = () => {
    if (message.type === 'error') return AlertCircle;
    if (message.type === 'workflow') return Wand2;
    return message.sender === 'user' ? User : Bot;
  };

  const getMessageColor = () => {
    if (message.type === 'error') return 'from-red-500 to-red-600';
    if (message.type === 'workflow') return 'from-green-500 to-green-600';
    return message.sender === 'user' 
      ? 'from-blue-500 to-purple-500'
      : 'from-green-500 to-green-600';
  };

  const MessageIcon = getMessageIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex gap-3 ${
        message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${
        getMessageColor()
      }`}>
        <MessageIcon className="w-4 h-4 text-white" />
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${
        message.sender === 'user' ? 'text-right' : 'text-left'
      }`}>
        <div className={`inline-block p-3 rounded-xl text-sm ${
          message.sender === 'user'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
            : message.type === 'error'
            ? 'bg-red-500/20 border border-red-500/30 text-red-300'
            : 'bg-white/5 border border-white/10 text-gray-200'
        }`}>
          {message.type === 'workflow' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <Wand2 className="w-4 h-4" />
                <span className="font-medium">Workflow Generated!</span>
              </div>
              <p className="text-gray-300">{message.content}</p>
              <div className="flex gap-2">
                <button 
                  onClick={handleExport}
                  className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Export JSON
                </button>
                <button className="px-3 py-1 bg-white/10 text-gray-300 rounded-lg text-xs hover:bg-white/20 transition-colors flex items-center gap-1">
                  <Code className="w-3 h-3" />
                  View Code
                </button>
              </div>
            </div>
          ) : (
            <p>{message.content}</p>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
}
