"use client";

import { useEffect } from "react";
import { WorkflowCanvas } from "@/components/dashboard/workflow/WorkflowCanvas";
import { SimpleChat } from "@/components/dashboard/chat/SimpleChat";
import { WorkflowSidebar } from "@/components/dashboard/workflow/WorkflowSidebar";
import { UserMenu } from "@/components/UserMenu";
import { useWorkflows, useWorkflowConversations, useOrphanConversations } from "@/hooks/data";
import { useWorkflowUI, WorkflowUIProvider } from "@/stores/WorkflowUIContext";
import { N8NWorkflow } from "@/types/api";
import { Sparkles } from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  // UI state management
  const {
    selectedWorkflowId,
    isChatOpen,
    activeConversationId,
    setActiveConversationId,
    selectWorkflow,
    createNewWorkflow,
    setIsChatOpen,
  } = useWorkflowUI();

  // Server state management
  const { data: workflows = [], isLoading } = useWorkflows();
  const { data: workflowConversations = [] } = useWorkflowConversations(selectedWorkflowId);
  const { data: orphanConversations = [] } = useOrphanConversations();

  // Get selected workflow and conversations based on UI state
  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId) || null;
  const conversations = selectedWorkflowId ? workflowConversations : orphanConversations;

  // Auto-select first conversation when conversations load
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId, setActiveConversationId]);

  const handleWorkflowGenerated = (workflow: N8NWorkflow) => {
    // Workflow generation is now handled entirely by the chat component
    // This will trigger React Query mutations and automatic UI updates
    console.log('Workflow generated:', workflow.name);
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  return (
    <div className="h-screen bg-black overflow-hidden">
      {/* Top Header */}
      <header className="h-16 border-b border-white/10 bg-black/90 backdrop-blur-sm px-6 flex items-center justify-between relative z-40">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">N8N.AI</span>
        </Link>

        {/* User Menu */}
        <UserMenu />
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-4rem)] overflow-hidden">
        <div className="flex flex-col h-full bg-black overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <WorkflowSidebar 
              workflows={workflows}
              selectedWorkflow={selectedWorkflow}
              onSelectWorkflow={(workflow) => selectWorkflow(workflow.id)}
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
                <span className="text-white font-bold">AI</span>
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
