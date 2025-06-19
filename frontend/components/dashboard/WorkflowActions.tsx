"use client";

import { motion } from "framer-motion";
import { Download, Play, Save, Loader2 } from "lucide-react";
import { Workflow, GeneratedWorkflow } from "@/hooks/useWorkflows";

interface WorkflowActionsProps {
  workflow: Workflow | GeneratedWorkflow;
  onTest: () => void;
  onExport: () => void;
  onSave: () => void;
  isTestingWorkflow: boolean;
}

export function WorkflowActions({ 
  workflow, 
  onTest, 
  onExport, 
  onSave, 
  isTestingWorkflow 
}: WorkflowActionsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/90 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onTest}
        disabled={isTestingWorkflow}
        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:shadow-orange-500/25 transition-all disabled:opacity-50"
      >
        {isTestingWorkflow ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {isTestingWorkflow ? 'Testing...' : 'Test workflow'}
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onExport}
        className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-white/20 transition-all border border-white/20"
      >
        <Download className="w-4 h-4" />
        Export JSON
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSave}
        className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-white/20 transition-all border border-white/20"
      >
        <Save className="w-4 h-4" />
        Save
      </motion.button>
    </div>
  );
}
