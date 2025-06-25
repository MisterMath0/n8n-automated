import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useStreamingData() {
  const queryClient = useQueryClient();

  const invalidateStreamingQueries = useCallback(() => {
    // Invalidate all streaming-related queries to ensure fresh data
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return key?.includes('conversation') || key?.includes('message') || key?.includes('chat');
      },
    });
  }, [queryClient]);

  const clearStreamingCache = useCallback(() => {
    // Remove specific streaming data from cache
    queryClient.removeQueries({
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return key?.includes('streaming') || key?.includes('live');
      },
    });
  }, [queryClient]);

  return {
    invalidateStreamingQueries,
    clearStreamingCache,
  };
}
