"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

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
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedId = localStorage.getItem('workflowUI:selectedWorkflowId');
        return storedId || null;
      } catch (e) {
        console.error('Failed to read selectedWorkflowId from localStorage', e);
        return null;
      }
    }
    return null;
  });

  const [isChatOpen, setIsChatOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedValue = localStorage.getItem('workflowUI:isChatOpen');
        return storedValue === 'true';
      } catch (e) {
        console.error('Failed to read isChatOpen from localStorage', e);
        return false;
      }
    }
    return false;
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedId = localStorage.getItem('workflowUI:activeConversationId');
        return storedId || null;
      } catch (e) {
        console.error('Failed to read activeConversationId from localStorage', e);
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (selectedWorkflowId) {
          localStorage.setItem('workflowUI:selectedWorkflowId', selectedWorkflowId);
        } else {
          localStorage.removeItem('workflowUI:selectedWorkflowId');
        }
      } catch (e) {
        console.error('Failed to write selectedWorkflowId to localStorage', e);
      }
    }
  }, [selectedWorkflowId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('workflowUI:isChatOpen', String(isChatOpen));
      } catch (e) {
        console.error('Failed to write isChatOpen to localStorage', e);
      }
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (activeConversationId) {
          localStorage.setItem('workflowUI:activeConversationId', activeConversationId);
        } else {
          localStorage.removeItem('workflowUI:activeConversationId');
        }
      } catch (e) {
        console.error('Failed to write activeConversationId to localStorage', e);
      }
    }
  }, [activeConversationId]);

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
