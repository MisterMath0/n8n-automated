"use client";

import React, { useState, useEffect } from 'react';
import { IconBrain, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

interface ThinkingDisplayProps {
  thinking: string;
  isVisible: boolean;
  isComplete: boolean;
  className?: string;
}

export function ThinkingDisplay({ thinking, isVisible, isComplete, className = "" }: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Auto-collapse when thinking is complete and main message starts
  useEffect(() => {
    if (isComplete && thinking) {
      const timer = setTimeout(() => setIsExpanded(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, thinking]);

  if (!isVisible || !thinking) return null;

  return (
    <div className={`thinking-display ${className}`}>
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 mb-4 transition-all duration-300">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 w-full text-left text-purple-300 hover:text-purple-200 transition-colors"
        >
          <IconBrain 
            size={16} 
            className={`text-purple-400 ${!isComplete ? 'animate-pulse' : ''}`} 
          />
          <span className="text-sm font-medium">
            {isComplete ? '✅ Reasoning Complete' : '🧠 Thinking...'}
          </span>
          <div className="flex-1" />
          {thinking && (
            <span className="text-xs text-purple-400">
              {thinking.length} chars
            </span>
          )}
          {isExpanded ? (
            <IconChevronUp size={16} />
          ) : (
            <IconChevronDown size={16} />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-3 pl-6 border-l-2 border-purple-500/20 transition-all duration-200">
            <div className="text-sm text-purple-100/80 whitespace-pre-wrap leading-relaxed">
              {thinking}
              {!isComplete && (
                <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}