import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { Workflow } from '@/types/workflow';

interface WorkflowCardProps {
  workflow: Workflow;
  isSelected: boolean;
  onSelect: () => void;
  onExport: (id: string, event: React.MouseEvent) => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
  showActions: boolean;
  onToggleActions: () => void;
  isDeleting: boolean;
}

export const WorkflowCard = React.memo<WorkflowCardProps>(({
  workflow,
  isSelected,
  onSelect,
  onExport,
  onDelete,
  showActions,
  onToggleActions,
  isDeleting
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-green-500 bg-green-500/10'
          : 'border-white/20 hover:border-white/30 hover:bg-white/5'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm truncate">{workflow.name}</h4>
          <p className="text-gray-400 text-xs mt-1 line-clamp-2">
            {workflow.description || `${workflow.nodes?.length || 0} nodes`}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>Updated {new Date(workflow.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActions();
            }}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-6 w-32 bg-black/90 border border-white/20 rounded-lg py-1 z-50"
              >
                <button
                  onClick={(e) => onExport(workflow.id, e)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
                <button
                  onClick={(e) => onDelete(workflow.id, e)}
                  disabled={isDeleting}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

WorkflowCard.displayName = 'WorkflowCard';
