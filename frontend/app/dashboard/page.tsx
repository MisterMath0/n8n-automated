"use client";

import { useState, useEffect } from "react";
import { WorkflowCanvas } from "@/components/dashboard/workflow/WorkflowCanvas";
import { SimpleChat } from "@/components/dashboard/chat/SimpleChat";
import { WorkflowSidebar } from "@/components/dashboard/workflow/WorkflowSidebar";
import { UserMenu } from "@/components/UserMenu";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useConversations } from "@/hooks/useConversations";
import { N8NWorkflow } from "@/types/api";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { 
    workflows, 
    selectedWorkflow, 
    selectWorkflow, 
    isLoading, 
    saveGeneratedWorkflow, 
    exportWorkflow, 
    deleteWorkflow 
  } = useWorkflows();
  
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    createConversation,
    updateConversationWorkflow
  } = useConversations();
  
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [currentWorkflow, setCurrentWorkflow] = useState<N8NWorkflow | null>(null);

  // Load conversation messages when a workflow is selected
  useEffect(() => {
    if (selectedWorkflow?.id && conversations.length > 0) {
      // Find conversation associated with this workflow
      const workflowConversation = conversations.find(conv => 
        conv.workflow_id === selectedWorkflow.id
      );
      
      console.log('Loading conversation for workflow:', selectedWorkflow.id);
      console.log('Found conversation:', workflowConversation?.id);
      console.log('Available conversations:', conversations.map(c => ({ id: c.id, workflow_id: c.workflow_id })));
      
      if (workflowConversation && workflowConversation.id !== currentConversation?.id) {
        setCurrentConversation(workflowConversation);
      }
    }
  }, [selectedWorkflow, conversations, setCurrentConversation, currentConversation]);

  const handleWorkflowGenerated = async (workflow: N8NWorkflow) => {
    setCurrentWorkflow(workflow);
    
    try {
      const savedWorkflow = await saveGeneratedWorkflow(
        workflow, 
        workflow.name,
        `Generated workflow with ${workflow.nodes.length} nodes`,
        undefined, 
        undefined, 
        undefined
      );
      
      // Link the current conversation to the saved workflow
      if (currentConversation && savedWorkflow.id) {
        await updateConversationWorkflow(currentConversation.id, savedWorkflow.id);
      }
      
      // Select the newly generated workflow
      selectWorkflow(savedWorkflow);
      
    } catch (error) {
      console.error('Failed to save generated workflow:', error);
    }
  };

  const handleCreateNew = async () => {
    try {
      // Clear current workflow and selection
      setCurrentWorkflow(null);
      selectWorkflow(null);
      
      // Create a new conversation for workflow generation
      const newConversation = await createConversation();
      if (newConversation) {
        setCurrentConversation(newConversation);
        setIsChatOpen(true);
        
        // Add a small delay to ensure chat is open before focusing
        setTimeout(() => {
          // The chat component will auto-focus when conversation changes
        }, 100);
      } else {
        // If conversation creation fails, still open chat for new session
        setIsChatOpen(true);
      }
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      // Still open chat even if conversation creation fails
      setIsChatOpen(true);
    }
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    if (!currentConversation) {
      handleCreateNew();
    }
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
              onSelectWorkflow={selectWorkflow}
              onExportWorkflow={exportWorkflow}
              onDeleteWorkflow={deleteWorkflow}
              onCreateNew={handleCreateNew}
              isLoading={isLoading}
            />
            
            <div className="flex-1 flex overflow-hidden">
              <WorkflowCanvas 
                workflow={currentWorkflow || selectedWorkflow}
                isLoading={isLoading}
                onWorkflowUpdate={(updatedWorkflow) => {
                  setCurrentWorkflow(updatedWorkflow.workflow || null);
                }}
                onOpenChat={handleOpenChat}
                onCreateNew={handleCreateNew}
              />
              
              {isChatOpen && (
                <SimpleChat 
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
