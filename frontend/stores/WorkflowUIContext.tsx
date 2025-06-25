"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface WorkflowUIState {
  selectedWorkflowId: string | null;
  isChatOpen: boolean;
  activeConversationId: string | null;
}

interface WorkflowUIContextType extends WorkflowUIState {
  setSelectedWorkflowId: (id: string | null) => void;
  setIsChatOpen: (open: boolean) => void;
  setActiveConversationId: (id: string | null) => void;
  selectWorkflow: (workflowId: string) => void;
  createNewWorkflow: () => void;
}

const WorkflowUIContext = createContext<WorkflowUIContextType | null>(null);

function getStoredValue(key: string, defaultValue: any) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStoredValue(key: string, value: any) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Silently fail
  }
}

export function WorkflowUIProvider({ children }: { children: ReactNode }) {
  const [selectedWorkflowId, setSelectedWorkflowIdState] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpenState] = useState<boolean>(false);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setSelectedWorkflowIdState(getStoredValue('workflowUI:selectedWorkflowId', null));
    setIsChatOpenState(getStoredValue('workflowUI:isChatOpen', false));
    setActiveConversationIdState(getStoredValue('workflowUI:activeConversationId', null));
    setIsHydrated(true);
  }, []);

  const setSelectedWorkflowId = useCallback((id: string | null) => {
    setSelectedWorkflowIdState(id);
    setStoredValue('workflowUI:selectedWorkflowId', id);
  }, []);

  const setIsChatOpen = useCallback((open: boolean) => {
    setIsChatOpenState(open);
    setStoredValue('workflowUI:isChatOpen', open);
  }, []);

  const setActiveConversationId = useCallback((id: string | null) => {
    setActiveConversationIdState(id);
    setStoredValue('workflowUI:activeConversationId', id);
  }, []);

  const selectWorkflow = useCallback((workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setIsChatOpen(true);
    setActiveConversationId(null);
  }, [setSelectedWorkflowId, setIsChatOpen, setActiveConversationId]);

  const createNewWorkflow = useCallback(() => {
    setSelectedWorkflowId(null);
    setIsChatOpen(true);
    setActiveConversationId(null);
  }, [setSelectedWorkflowId, setIsChatOpen, setActiveConversationId]);

  if (!isHydrated) {
    return null;
  }

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
