"use client";

import React, { createContext, useContext, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  APIClientError, 
  NetworkError, 
  TimeoutError 
} from '@/lib/api';

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  loading: (message: string) => string;
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => Promise<T>;
  handleApiError: (error: unknown, fallbackMessage?: string) => void;
  dismiss: (toastId?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const success = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const error = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const warning = useCallback((message: string) => {
    toast.warning(message);
  }, []);

  const info = useCallback((message: string) => {
    toast.info(message);
  }, []);

  const loading = useCallback((message: string) => {
    return toast.loading(message);
  }, []);

  const promise = useCallback(<T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, options);
  }, []);

  const handleApiError = useCallback((error: unknown, fallbackMessage = 'An unexpected error occurred') => {
    let message = fallbackMessage;
    
    if (error instanceof APIClientError) {
      message = error.message;
      // Could add additional logic based on status code
      if (error.status === 429) {
        message = 'Rate limit exceeded. Please try again later.';
      } else if (error.status >= 500) {
        message = 'Server error. Please try again later.';
      }
    } else if (error instanceof NetworkError) {
      message = 'Network connection failed. Please check your internet connection.';
    } else if (error instanceof TimeoutError) {
      message = 'Request timed out. Please try again.';
    } else if (error instanceof Error) {
      message = error.message;
    }
    
    toast.error(message);
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    toast.dismiss(toastId);
  }, []);

  const value: ToastContextType = {
    success,
    error,
    warning,
    info,
    loading,
    promise,
    handleApiError,
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
