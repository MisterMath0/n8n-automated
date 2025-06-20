"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, FileText, Clock, CheckCircle, Loader2, Download, Trash2, MoreVertical } from "lucide-react";
import { Workflow } from "@/hooks/useWorkflows";
import { EmptyWorkflows } from "./EmptyWorkflows";

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

const ITEMS_PER_PAGE = 10;

export function WorkflowSidebar({ 
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
  const [displayedWorkflows, setDisplayedWorkflows] = useState<Workflow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize displayed workflows when workflows change
  useEffect(() => {
    if (!isLoading && workflows.length > 0) {
      const initialWorkflows = workflows.slice(0, ITEMS_PER_PAGE);
      setDisplayedWorkflows(initialWorkflows);
      setCurrentPage(1);
    } else if (!isLoading && workflows.length === 0) {
      setDisplayedWorkflows([]);
      setCurrentPage(1);
    }
  }, [workflows, isLoading]);

  // Load more workflows when scrolling
  const loadMoreWorkflows = useCallback(() => {
    if (isLoadingMore || isLoading) return;
    
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const hasMore = workflows.length > startIndex;
    
    if (!hasMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const newWorkflows = workflows.slice(startIndex, endIndex);
      setDisplayedWorkflows(prev => [...prev, ...newWorkflows]);
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(false);
    }, 300);
  }, [workflows, currentPage, isLoadingMore, isLoading]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    if (isNearBottom && !isLoadingMore && !isLoading) {
      loadMoreWorkflows();
    }
  }, [loadMoreWorkflows, isLoadingMore, isLoading]);

  const handleExport = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowActions(null);
    onExportWorkflow?.(id);
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowActions(null);
    
    if (!onDeleteWorkflow) return;
    
    setDeletingId(id);
    try {
      await onDeleteWorkflow(id);
      // Remove from displayed workflows locally for immediate feedback
      setDisplayedWorkflows(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const renderWorkflowCard = (workflow: Workflow) => (
    <motion.div
      key={workflow.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
        selectedWorkflow?.id === workflow.id
          ? 'border-green-500 bg-green-500/10'
          : 'border-white/20 hover:border-white/30 hover:bg-white/5'
      }`}
      onClick={() => onSelectWorkflow(workflow)}
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
              setShowActions(showActions === workflow.id ? null : workflow.id);
            }}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showActions === workflow.id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-6 w-32 bg-black/90 border border-white/20 rounded-lg py-1 z-50"
            >
              <button
                onClick={(e) => handleExport(workflow.id, e)}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
              <button
                onClick={(e) => handleDelete(workflow.id, e)}
                disabled={deletingId === workflow.id}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 disabled:opacity-50"
              >
                {deletingId === workflow.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'workflows':
        return (
          <div className="flex-1 overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                  <span className="text-gray-400 text-sm">Loading workflows...</span>
                  <p className="text-gray-500 text-xs mt-1">This might take a moment</p>
                </div>
              </div>
            ) : workflows.length === 0 ? (
              <EmptyWorkflows onCreateWorkflow={onCreateNew} />
            ) : (
              <>
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto space-y-2 p-2 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600"
                  onScroll={handleScroll}
                >
                  {displayedWorkflows.map(renderWorkflowCard)}
                  
                  {/* Loading more indicator */}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      <span className="ml-2 text-gray-400 text-sm">Loading more...</span>
                    </div>
                  )}
                  
                  {/* End of list indicator */}
                  {displayedWorkflows.length >= workflows.length && workflows.length > ITEMS_PER_PAGE && (
                    <div className="text-center p-4 text-gray-500 text-sm">
                      • End of workflows •
                    </div>
                  )}
                </div>
                
                {/* Scroll indicator */}
                {workflows.length > ITEMS_PER_PAGE && (
                  <div className="px-4 py-2 border-t border-white/10 text-xs text-gray-500 text-center">
                    Showing {displayedWorkflows.length} of {workflows.length} workflows
                    {displayedWorkflows.length < workflows.length && " • Scroll for more"}
                  </div>
                )}
              </>
            )}
          </div>
        );
        
      case 'templates':
        return (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">Templates Coming Soon</h3>
              <p className="text-sm">Pre-built workflow templates will be available here</p>
            </div>
          </div>
        );
        
      case 'history':
        return (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">Generation History</h3>
              <p className="text-sm">Your workflow generation history will appear here</p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="w-80 h-full bg-black/80 border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Workflows</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateNew}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg font-medium flex items-center gap-2 hover:shadow-green-500/25 hover:shadow-lg transition-all duration-200"
            title="Start a new workflow generation chat"
          >
            <Plus className="w-4 h-4" />
            Generate New
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button 
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'workflows' 
                ? 'text-green-400 border-green-400' 
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            Workflows
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'templates' 
                ? 'text-green-400 border-green-400' 
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            Templates
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'history' 
                ? 'text-green-400 border-green-400' 
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Footer - Only show for workflows */}
      {activeTab === 'workflows' && workflows.length > 0 && (
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
}
