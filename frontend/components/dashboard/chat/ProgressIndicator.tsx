"use client";

import { motion } from "framer-motion";
import { Loader2, Cpu, Search, Lightbulb } from "lucide-react";

interface ProgressIndicatorProps {
  message: string;
}

export function ProgressIndicator({ message }: ProgressIndicatorProps) {
  // Smart icon selection based on progress message
  const getProgressIcon = () => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('analyzing') || lowerMessage.includes('processing')) {
      return <Cpu className="w-4 h-4 text-blue-400" />;
    }
    if (lowerMessage.includes('search') || lowerMessage.includes('documentation')) {
      return <Search className="w-4 h-4 text-green-400" />;
    }
    if (lowerMessage.includes('generating') || lowerMessage.includes('creating')) {
      return <Lightbulb className="w-4 h-4 text-yellow-400" />;
    }
    
    return <Loader2 className="w-4 h-4 text-green-400 animate-spin" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 max-w-[80%]"
    >
      <div className="flex-1">
        <motion.div 
          className="bg-gray-800/80 backdrop-blur border border-gray-700/50 rounded-2xl px-4 py-3"
          animate={{ 
            boxShadow: [
              "0 0 0 0 rgba(34, 197, 94, 0.4)",
              "0 0 0 4px rgba(34, 197, 94, 0.1)",
              "0 0 0 0 rgba(34, 197, 94, 0.4)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              {getProgressIcon()}
            </motion.div>
            
            <div className="flex-1">
              <motion.p 
                className="text-gray-300 text-sm"
                initial={{ opacity: 0.7 }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {message}
              </motion.p>
              
              {/* Progress dots animation */}
              <div className="flex items-center gap-1 mt-2">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    className="w-1.5 h-1.5 bg-green-400 rounded-full"
                    animate={{
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: index * 0.2
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
