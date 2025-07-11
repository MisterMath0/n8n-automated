"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, CheckCircle } from "lucide-react";
import { Workflow } from "@/types/workflow";
import { WorkflowList } from "./components/WorkflowList";
import { TabContent } from "./components/TabContent";
import { usePagination } from "./hooks";

interface WorkflowSidebarProps {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (workflow: Workflow | null) => void;
  onExportWorkflow?: (id: string) => void;
  onDeleteWorkflow?: (id: string) => Promise<void>;
  onCreateNew?: () => void;
  isLoading: boolean;
}

type TabType = 'workflows' | 'templates' | 'history';

export const WorkflowSidebar = React.memo(function WorkflowSidebar({ 
  workflows, 
  selectedWorkflow, 
  onSelectWorkflow,
  onExportWorkflow,
  onDeleteWorkflow,
  onCreateNew,
  isLoading 
}: WorkflowSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('workflows');
  const [showActions, setShowActions] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const {
    displayedCount,
    hasMore,
    isLoadingMore,
    handleScroll,
  } = usePagination(workflows);

  const toggleActions = useCallback((workflowId: string) => {
    setShowActions(prev => prev === workflowId ? null : workflowId);
  }, []);

  const handleDeleteWorkflow = useCallback(async (id: string) => {
    if (!onDeleteWorkflow) return;
    
    setDeletingId(id);
    try {
      await onDeleteWorkflow(id);
    } finally {
      setDeletingId(null);
    }
  }, [onDeleteWorkflow]);

  return (
    <div className="w-80 h-full bg-black/80 border-r border-white/10 flex flex-col">
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Workflows</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateNew}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg font-medium flex items-center gap-2 hover:shadow-green-500/25 hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Generate New
          </motion.button>
        </div>

        <div className="flex gap-1">
          {(['workflows', 'templates', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 capitalize ${
                activeTab === tab
                  ? 'text-green-400 border-green-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'workflows' ? (
          <WorkflowList
            workflows={workflows}
            selectedWorkflow={selectedWorkflow}
            onSelectWorkflow={onSelectWorkflow}
            onExportWorkflow={onExportWorkflow}
            onDeleteWorkflow={handleDeleteWorkflow}
            onCreateNew={onCreateNew}
            isLoading={isLoading}
            displayedCount={displayedCount}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onScroll={handleScroll}
            showActions={showActions}
            toggleActions={toggleActions}
            deletingId={deletingId}
          />
        ) : (
          <TabContent type={activeTab as 'templates' | 'history'} />
        )}
      </div>

      {activeTab === 'workflows' && workflows.length > 0 && !isLoading && (
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{workflows.length} saved workflow{workflows.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-400">Ready to export</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
