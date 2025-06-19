"""
BM25 Search Cache

Caching mechanism for search results with TTL support.
"""

import hashlib
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any

from .search_models import SearchResult


class SearchCache:
    """
    Simple in-memory cache for search results with TTL (Time To Live) support.
    
    This cache improves performance by storing frequently requested search results
    and avoiding redundant BM25 calculations.
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache: Dict[str, Tuple[List[SearchResult], datetime]] = {}
        self.lock = threading.RLock()
        self.hits = 0
        self.misses = 0
    
    def _make_key(self, query: str, top_k: int, filters: Optional[Dict[str, Any]] = None) -> str:
        """Create a cache key from search parameters"""
        key_data = f"{query}|{top_k}|{filters or {}}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, query: str, top_k: int, filters: Optional[Dict[str, Any]] = None) -> Optional[List[SearchResult]]:
        """Get cached results if they exist and haven't expired"""
        key = self._make_key(query, top_k, filters)
        
        with self.lock:
            if key in self.cache:
                results, timestamp = self.cache[key]
                if datetime.now() - timestamp < timedelta(seconds=self.ttl_seconds):
                    self.hits += 1
                    return results
                else:
                    # Expired, remove from cache
                    del self.cache[key]
            
            self.misses += 1
            return None
    
    def set(self, query: str, top_k: int, results: List[SearchResult], filters: Optional[Dict[str, Any]] = None):
        """Store results in cache"""
        key = self._make_key(query, top_k, filters)
        
        with self.lock:
            # Remove oldest items if cache is full
            if len(self.cache) >= self.max_size:
                oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
                del self.cache[oldest_key]
            
            self.cache[key] = (results, datetime.now())
    
    def clear(self):
        """Clear all cached results"""
        with self.lock:
            self.cache.clear()
            self.hits = 0
            self.misses = 0
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self.lock:
            total_items = len(self.cache)
            total_requests = self.hits + self.misses
            hit_ratio = self.hits / max(total_requests, 1)
            
            expired_items = sum(
                1 for _, timestamp in self.cache.values()
                if datetime.now() - timestamp >= timedelta(seconds=self.ttl_seconds)
            )
            
            return {
                "total_items": total_items,
                "expired_items": expired_items,
                "hits": self.hits,
                "misses": self.misses,
                "hit_ratio": hit_ratio,
                "max_size": self.max_size,
                "ttl_seconds": self.ttl_seconds
            }
