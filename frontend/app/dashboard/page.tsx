"use client";

import { useCallback } from "react";
import { WorkflowCanvas } from "@/components/dashboard/workflow/WorkflowCanvas";
import { SimpleChat } from "@/components/dashboard/chat/SimpleChat";
import { WorkflowSidebar } from "@/components/dashboard/workflow/WorkflowSidebar";
import { UserMenu } from "@/components/UserMenu";
import { useWorkflows, useWorkflowConversations, useOrphanConversations, useDeleteWorkflow } from "@/hooks/data";
import { useWorkflowUI, WorkflowUIProvider } from "@/stores/WorkflowUIContext";
import { useToast } from "@/components/providers";
import { Workflow } from "@/types/workflow";
import { Bot } from "lucide-react";
import Link from "next/link";

// Disable all caching for dashboard
export const dynamic = 'force-dynamic'
export const revalidate = 0

function DashboardContent() {
  const {
    selectedWorkflowId,
    isChatOpen,
    activeConversationId,
    setSelectedWorkflowId,
    setActiveConversationId,
    selectWorkflow,
    createNewWorkflow,
    setIsChatOpen,
  } = useWorkflowUI();

  const { data: workflows = [], isLoading } = useWorkflows();
  const { data: workflowConversations = [] } = useWorkflowConversations(selectedWorkflowId);
  const { data: orphanConversations = [] } = useOrphanConversations();
  const deleteWorkflow = useDeleteWorkflow();
  const toast = useToast();

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId) || null;
  const conversations = selectedWorkflowId ? workflowConversations : orphanConversations;

  // FIXED: Stable workflow generated handler - doesn't change conversation
  const handleWorkflowGenerated = useCallback((workflow: Workflow) => {
    // Only switch to new workflow if we're not already working on one
    if (!selectedWorkflowId && workflow.id !== selectedWorkflowId) {
      selectWorkflow(workflow.id);
    }
    // Don't change conversation - let it stay attached to current workflow context
  }, [selectedWorkflowId, selectWorkflow]);

  const handleOpenChat = useCallback(() => {
    setIsChatOpen(true);
  }, [setIsChatOpen]);

  const handleExportWorkflow = useCallback(async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow?.workflow) {
      toast.error('Workflow not found');
      return;
    }
    
    try {
      const blob = new Blob([JSON.stringify(workflow.workflow, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflow.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Workflow exported successfully');
    } catch {
      toast.error('Failed to export workflow');
    }
  }, [workflows, toast]);
  
  const handleDeleteWorkflow = useCallback(async (workflowId: string) => {
    try {
      await deleteWorkflow.mutateAsync(workflowId);
      if (selectedWorkflowId === workflowId) {
        setSelectedWorkflowId(null);
      }
    } catch {
      // Error handling is done in the mutation
    }
  }, [deleteWorkflow, selectedWorkflowId, setSelectedWorkflowId]);

  return (
    <div className="h-screen bg-black overflow-hidden">
      <ExtensionWarning />
      
      <header className="h-16 border-b border-white/10 bg-black/90 backdrop-blur-sm px-6 flex items-center justify-between relative z-40">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Autokraft</span>
        </Link>
        <UserMenu />
      </header>

      <main className="h-[calc(100vh-4rem)] overflow-hidden">
        <div className="flex flex-col h-full bg-black overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <WorkflowSidebar 
              workflows={workflows}
              selectedWorkflow={selectedWorkflow}
              onSelectWorkflow={(workflow) => selectWorkflow(workflow.id)}
              onExportWorkflow={handleExportWorkflow}
              onDeleteWorkflow={handleDeleteWorkflow}
              onCreateNew={createNewWorkflow}
              isLoading={isLoading}
            />
            
            <div className="flex-1 flex overflow-hidden">
              <WorkflowCanvas 
                workflow={selectedWorkflow}
                isLoading={isLoading}
                onOpenChat={handleOpenChat}
                onCreateNew={createNewWorkflow}
              />
              
              {isChatOpen && (
                <SimpleChat 
                  workflowId={selectedWorkflowId}
                  conversationId={activeConversationId}
                  conversations={conversations}
                  onConversationChange={setActiveConversationId}
                  onClose={() => setIsChatOpen(false)}
                  onWorkflowGenerated={handleWorkflowGenerated}
                />
              )}
            </div>
            
            {!isChatOpen && (
              <button
                onClick={handleOpenChat}
                className="fixed right-4 bottom-4 w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-green-500/25 transition-all z-50"
              >
                <Bot className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <WorkflowUIProvider>
      <DashboardContent />
    </WorkflowUIProvider>
  );
}
