"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// UI state only - not server data
interface WorkflowUIState {
  selectedWorkflowId: string | null;
  isChatOpen: boolean;
  activeConversationId: string | null;
}

interface WorkflowUIContextType extends WorkflowUIState {
  setSelectedWorkflowId: (id: string | null) => void;
  setIsChatOpen: (open: boolean) => void;
  setActiveConversationId: (id: string | null) => void;
  // Helper methods
  selectWorkflow: (workflowId: string) => void;
  createNewWorkflow: () => void;
}

const WorkflowUIContext = createContext<WorkflowUIContextType | null>(null);

export function WorkflowUIProvider({ children }: { children: ReactNode }) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const selectWorkflow = useCallback((workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setIsChatOpen(true); // Auto-open chat when selecting workflow
    setActiveConversationId(null); // Reset conversation (will be set by conversations hook)
  }, []);

  const createNewWorkflow = useCallback(() => {
    setSelectedWorkflowId(null);
    setIsChatOpen(true);
    setActiveConversationId(null);
  }, []);

  return (
    <WorkflowUIContext.Provider value={{
      selectedWorkflowId,
      isChatOpen,
      activeConversationId,
      setSelectedWorkflowId,
      setIsChatOpen,
      setActiveConversationId,
      selectWorkflow,
      createNewWorkflow,
    }}>
      {children}
    </WorkflowUIContext.Provider>
  );
}

export function useWorkflowUI() {
  const context = useContext(WorkflowUIContext);
  if (!context) {
    throw new Error('useWorkflowUI must be used within WorkflowUIProvider');
  }
  return context;
}
