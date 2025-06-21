import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowAPI } from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/providers';

// Query keys for caching
export const workflowKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowKeys.all, 'list'] as const,
  list: (userId: string) => [...workflowKeys.lists(), userId] as const,
  details: () => [...workflowKeys.all, 'detail'] as const,
  detail: (id: string, userId: string) => [...workflowKeys.details(), id, userId] as const,
};

// Get all workflows for the current user
export function useWorkflows() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: workflowKeys.list(user?.id || ''),
    queryFn: () => workflowAPI.list(user!.id),
    enabled: !!user?.id,
  });
}

// Get single workflow
export function useWorkflow(workflowId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: workflowKeys.detail(workflowId, user?.id || ''),
    queryFn: () => workflowAPI.get(workflowId, user!.id),
    enabled: !!user?.id && !!workflowId,
  });
}

// Create workflow mutation
export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  
  return useMutation({
    mutationFn: workflowAPI.create,
    onSuccess: (data) => {
      // Invalidate workflows list to refetch
      queryClient.invalidateQueries({ queryKey: workflowKeys.list(user?.id || '') });
      toast.success(`Workflow "${data.name}" created successfully!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create workflow: ${error.message}`);
    },
  });
}

// Update workflow mutation
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  
  return useMutation({
    mutationFn: ({ workflowId, updates }: { workflowId: string; updates: any }) =>
      workflowAPI.update(workflowId, user!.id, updates),
    onSuccess: (data) => {
      // Update both list and detail queries
      queryClient.invalidateQueries({ queryKey: workflowKeys.list(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(data.id, user?.id || '') });
      toast.success('Workflow updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update workflow: ${error.message}`);
    },
  });
}

// Delete workflow mutation
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (workflowId: string) => workflowAPI.delete(workflowId, user!.id),
    onSuccess: () => {
      // Invalidate workflows list
      queryClient.invalidateQueries({ queryKey: workflowKeys.list(user?.id || '') });
      toast.success('Workflow deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete workflow: ${error.message}`);
    },
  });
}
