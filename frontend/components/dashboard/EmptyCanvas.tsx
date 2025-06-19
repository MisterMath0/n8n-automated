"use client";

import { motion } from "framer-motion";
import { Sparkles, MessageSquare } from "lucide-react";

export function EmptyCanvas() {
  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 bg-black/80 border border-white/20 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-gray-400" />
        </div>
        
        <h3 className="text-xl font-medium text-white mb-3">
          Ready to Create Magic?
        </h3>
        
        <p className="text-gray-400 mb-8 leading-relaxed">
          Select a workflow from the sidebar or start a conversation with our AI assistant to generate your first automation.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:shadow-green-500/25 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Chat with AI
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-white/10 border border-white/20 text-gray-300 rounded-lg font-medium hover:bg-white/20 transition-all"
          >
            Browse Templates
          </motion.button>
        </div>
        
        <div className="mt-8 text-xs text-gray-500">
          💡 Tip: Describe any automation in plain English and watch AI build it for you
        </div>
      </motion.div>
    </div>
  );
}
