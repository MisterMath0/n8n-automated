import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Workflow } from '@/hooks/useWorkflows';
import { WorkflowCard } from './WorkflowCard';
import { EmptyWorkflows } from '../EmptyWorkflows';

interface WorkflowListProps {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (workflow: Workflow) => void;
  onExportWorkflow?: (id: string) => void;
  onDeleteWorkflow?: (id: string) => Promise<void>;
  onCreateNew?: () => void;
  isLoading: boolean;
  displayedCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  showActions: string | null;
  toggleActions: (workflowId: string) => void;
  deletingId: string | null;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({
  workflows,
  selectedWorkflow,
  onSelectWorkflow,
  onExportWorkflow,
  onDeleteWorkflow,
  onCreateNew,
  isLoading,
  displayedCount,
  hasMore,
  isLoadingMore,
  onScroll,
  showActions,
  toggleActions,
  deletingId
}) => {
  const displayedWorkflows = workflows.slice(0, displayedCount);

  const handleExport = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    toggleActions('');
    onExportWorkflow?.(id);
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    toggleActions('');
    await onDeleteWorkflow?.(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
          <span className="text-gray-400 text-sm">Loading workflows...</span>
        </div>
      </div>
    );
  }

  if (workflows.length === 0) {
    return <EmptyWorkflows onCreateWorkflow={onCreateNew || (() => {})} />;
  }

  return (
    <>
      <div 
        className="flex-1 overflow-y-auto space-y-2 p-2 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600"
        onScroll={onScroll}
      >
        <AnimatePresence mode="popLayout">
          {displayedWorkflows.map(workflow => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              isSelected={selectedWorkflow?.id === workflow.id}
              onSelect={() => onSelectWorkflow(workflow)}
              onExport={handleExport}
              onDelete={handleDelete}
              showActions={showActions === workflow.id}
              onToggleActions={() => toggleActions(workflow.id)}
              isDeleting={deletingId === workflow.id}
            />
          ))}
        </AnimatePresence>
        
        {isLoadingMore && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-400 text-sm">Loading more...</span>
          </div>
        )}
        
        {!hasMore && workflows.length > 10 && (
          <div className="text-center p-4 text-gray-500 text-sm">
            • End of workflows •
          </div>
        )}
      </div>
      
      {workflows.length > 10 && (
        <div className="px-4 py-2 border-t border-white/10 text-xs text-gray-500 text-center">
          Showing {displayedWorkflows.length} of {workflows.length} workflows
          {hasMore && " • Scroll for more"}
        </div>
      )}
    </>
  );
};
