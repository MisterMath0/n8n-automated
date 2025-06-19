"use client";

import { motion } from "framer-motion";
import { Plus, Network, MessageSquare } from "lucide-react";

interface EmptyWorkflowsProps {
  onCreateWorkflow: () => void;
}

export function EmptyWorkflows({ onCreateWorkflow }: EmptyWorkflowsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 text-center"
    >
      <div className="w-16 h-16 bg-black/80 border border-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Network className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium text-white mb-2">
        No Workflows Yet
      </h3>
      
      <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
        Start by creating your first AI-generated workflow or chat with our AI assistant.
      </p>
      
      <div className="space-y-3">
        <motion.button
          onClick={onCreateWorkflow}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:shadow-green-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Workflow
        </motion.button>
        
        <button className="w-full px-4 py-3 bg-white/5 border border-white/20 text-gray-300 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
          <MessageSquare className="w-4 h-4" />
          Chat with AI
        </button>
      </div>
    </motion.div>
  );
}
