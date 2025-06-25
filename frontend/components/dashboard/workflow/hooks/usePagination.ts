import { useState, useCallback, useRef, useEffect } from 'react';

const ITEMS_PER_PAGE = 10;

export function usePagination<T>(items: T[]) {
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const prevItemsLengthRef = useRef(items.length);
  
  useEffect(() => {
    if (prevItemsLengthRef.current !== items.length) {
      prevItemsLengthRef.current = items.length;
      setDisplayedCount(ITEMS_PER_PAGE);
    }
  }, [items.length]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const hasMore = displayedCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    loadingTimeoutRef.current = setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, items.length));
      setIsLoadingMore(false);
    }, 300);
  }, [hasMore, isLoadingMore, items.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const threshold = 100;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    if (isNearBottom && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  return {
    displayedCount,
    hasMore,
    isLoadingMore,
    handleScroll,
  };
}
