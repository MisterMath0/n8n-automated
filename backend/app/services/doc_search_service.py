"""
BM25 Documentation Search Service

Main service that orchestrates BM25 search functionality.
This is the main entry point for all search operations.
"""

import time
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from functools import lru_cache

import structlog

from ..core.config_loader import config_loader
from .search_models import SearchResult, SearchStats
from .search_cache import SearchCache
from .bm25_index import BM25IndexManager
from .text_processor import TextProcessor

logger = structlog.get_logger()


class BM25DocumentationSearch:
    """
    Main BM25 search service for N8N documentation.
    
    This service provides:
    1. Fast BM25-based search
    2. Configurable text processing
    3. Result caching
    4. Section type filtering
    5. Node type boosting
    
    Usage:
        search_service = BM25DocumentationSearch()
        results, stats = search_service.search("how to send email", top_k=5)
    """
    
    def __init__(self):
        self.config = config_loader.load_search_config()
        self.data_dir = Path(__file__).parent.parent.parent / "data"
        
        # Initialize components
        self.index_manager = BM25IndexManager(self.config, self.data_dir)
        self.text_processor = TextProcessor(self.config["text_processing"])
        
        # Initialize cache
        cache_config = self.config["performance"]
        self.cache = SearchCache(
            max_size=cache_config["cache_size"],
            ttl_seconds=cache_config["cache_ttl"]
        ) if cache_config["enable_caching"] else None
        
        # Statistics
        self.search_count = 0
        
        # Initialize the index
        self._initialize_index()
    
    def _initialize_index(self):
        """Initialize or load the BM25 index"""
        try:
            if self.index_manager.should_rebuild_index():
                logger.info("Building new BM25 index")
                self.index_manager.build_index()
            else:
                logger.info("Loading existing BM25 index")
                self.index_manager.load_index()
                
            logger.info(
                "BM25 search service ready",
                document_count=len(self.index_manager.documents),
                cache_enabled=self.cache is not None
            )
            
        except Exception as e:
            logger.error("Failed to initialize search service", error=str(e))
            raise RuntimeError(f"Could not initialize search service: {e}")
    
    def search(
        self,
        query: str,
        top_k: int = None,
        filters: Optional[Dict[str, Any]] = None,
        include_highlights: bool = True
    ) -> Tuple[List[SearchResult], SearchStats]:
        """
        Search the documentation using BM25 algorithm.
        
        Args:
            query: Search query string
            top_k: Maximum number of results to return
            filters: Optional filters (section_type, node_type, min_score)
            include_highlights: Whether to include highlighted snippets
            
        Returns:
            Tuple of (search_results, search_stats)
        """
        start_time = time.time()
        
        # Validate inputs
        if not query or not query.strip():
            return [], SearchStats(
                query=query,
                total_results=0,
                search_time_ms=0,
                results_returned=0,
                index_size=len(self.index_manager.documents)
            )
        
        # Set defaults
        if top_k is None:
            top_k = self.config["search_behavior"]["default_top_k"]
        
        # Enforce limits
        max_top_k = self.config["search_behavior"]["max_top_k"]
        top_k = min(top_k, max_top_k)
        
        # Check cache first
        cache_hit = False
        if self.cache:
            cached_results = self.cache.get(query, top_k, filters)
            if cached_results:
                cache_hit = True
                search_time = (time.time() - start_time) * 1000
                
                return cached_results, SearchStats(
                    query=query,
                    total_results=len(cached_results),
                    search_time_ms=search_time,
                    results_returned=len(cached_results),
                    cache_hit=True,
                    index_size=len(self.index_manager.documents)
                )
        
        # Preprocess query
        query_tokens = self.text_processor.preprocess_text(query)
        if not query_tokens:
            return [], SearchStats(
                query=query,
                total_results=0,
                search_time_ms=(time.time() - start_time) * 1000,
                results_returned=0,
                index_size=len(self.index_manager.documents)
            )
        
        try:
            # Perform BM25 search
            doc_scores = self.index_manager.retriever.get_scores(query_tokens)
            
            # Create scored document pairs
            scored_docs = [(i, score) for i, score in enumerate(doc_scores) if score > 0]
            
            # Apply minimum score threshold
            min_threshold = self.config["search_behavior"]["min_score_threshold"]
            scored_docs = [(i, score) for i, score in scored_docs if score >= min_threshold]
            
            # Apply section type weighting
            scored_docs = self._apply_section_weighting(scored_docs)
            
            # Apply node type boost
            scored_docs = self._apply_node_boost(query, scored_docs)
            
            # Apply filters
            if filters:
                scored_docs = self._apply_filters(scored_docs, filters)
            
            # Sort and limit
            scored_docs.sort(key=lambda x: x[1], reverse=True)
            total_results = len(scored_docs)
            scored_docs = scored_docs[:top_k]
            
            # Create search results
            results = []
            for doc_idx, score in scored_docs:
                result = self._create_search_result(
                    doc_idx, 
                    score, 
                    query if include_highlights else ""
                )
                results.append(result)
            
            # Cache results
            if self.cache:
                self.cache.set(query, top_k, results, filters)
            
            # Update statistics
            self.search_count += 1
            search_time = (time.time() - start_time) * 1000
            
            # Log slow queries
            threshold = self.config["logging"]["log_slow_queries_threshold"]
            if (search_time / 1000) > threshold:
                logger.warning(
                    "Slow search query",
                    query=query,
                    search_time_ms=search_time,
                    total_results=total_results
                )
            
            # Log search if configured
            if self.config["logging"]["log_searches"]:
                logger.info(
                    "Search completed",
                    query=query,
                    total_results=total_results,
                    results_returned=len(results),
                    search_time_ms=round(search_time, 2)
                )
            
            stats = SearchStats(
                query=query,
                total_results=total_results,
                search_time_ms=search_time,
                results_returned=len(results),
                cache_hit=cache_hit,
                index_size=len(self.index_manager.documents)
            )
            
            return results, stats
            
        except Exception as e:
            logger.error("Search failed", query=query, error=str(e))
            search_time = (time.time() - start_time) * 1000
            
            return [], SearchStats(
                query=query,
                total_results=0,
                search_time_ms=search_time,
                results_returned=0,
                cache_hit=False,
                index_size=len(self.index_manager.documents)
            )
    
    def _apply_section_weighting(self, scored_docs: List[Tuple[int, float]]) -> List[Tuple[int, float]]:
        """Apply section type weighting to boost certain types of content"""
        weights = self.config["search_behavior"]["section_type_weights"]
        
        weighted_results = []
        for doc_idx, score in scored_docs:
            doc = self.index_manager.documents[doc_idx]
            section_type = doc.get('section_type', 'general')
            weight = weights.get(section_type, 1.0)
            weighted_score = score * weight
            weighted_results.append((doc_idx, weighted_score))
        
        return weighted_results
    
    def _apply_node_boost(self, query: str, scored_docs: List[Tuple[int, float]]) -> List[Tuple[int, float]]:
        """Boost results that match node types mentioned in the query"""
        query_lower = query.lower()
        boost_factor = self.config["search_behavior"]["node_type_boost"]
        
        boosted_results = []
        for doc_idx, score in scored_docs:
            doc = self.index_manager.documents[doc_idx]
            node_type = doc.get('node_type')
            
            # Check if query mentions this node type
            if node_type and node_type.lower() in query_lower:
                boosted_score = score * boost_factor
                boosted_results.append((doc_idx, boosted_score))
            else:
                boosted_results.append((doc_idx, score))
        
        return boosted_results
    
    def _apply_filters(self, scored_docs: List[Tuple[int, float]], filters: Dict[str, Any]) -> List[Tuple[int, float]]:
        """Apply filters to search results"""
        filtered = []
        
        for doc_idx, score in scored_docs:
            doc = self.index_manager.documents[doc_idx]
            include = True
            
            # Filter by section type
            if 'section_type' in filters:
                if doc.get('section_type') != filters['section_type']:
                    include = False
            
            # Filter by node type
            if 'node_type' in filters:
                if doc.get('node_type') != filters['node_type']:
                    include = False
            
            # Filter by minimum score
            if 'min_score' in filters:
                if score < filters['min_score']:
                    include = False
            
            if include:
                filtered.append((doc_idx, score))
        
        return filtered
    
    def _create_search_result(self, doc_idx: int, score: float, query: str = "") -> SearchResult:
        """Create a SearchResult object from document index and score"""
        doc = self.index_manager.documents[doc_idx]
        
        # Create highlight if requested
        highlight = None
        if query:
            highlight = self.text_processor.create_highlight(doc.get('content', ''), query)
        
        return SearchResult(
            title=doc.get('title', 'Untitled'),
            content=doc.get('content', ''),
            url=doc.get('url', ''),
            score=score,
            section_type=doc.get('section_type', 'general'),
            node_type=doc.get('node_type'),
            chunk_index=doc.get('chunk_index', 0),
            word_count=doc.get('word_count', 0),
            highlight=highlight
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get service statistics"""
        cache_stats = self.cache.stats() if self.cache else {}
        
        return {
            "index": {
                "document_count": len(self.index_manager.documents),
                "index_timestamp": self.index_manager.index_timestamp.isoformat() if self.index_manager.index_timestamp else None,
                "index_file_exists": self.index_manager.index_file.exists(),
                "index_file_size_mb": round(self.index_manager.index_file.stat().st_size / 1024 / 1024, 2) if self.index_manager.index_file.exists() else 0
            },
            "search": {
                "total_searches": self.search_count,
                "cache_hits": cache_stats.get('hits', 0),
                "cache_misses": cache_stats.get('misses', 0),
                "cache_hit_ratio": cache_stats.get('hit_ratio', 0.0),
            },
            "cache": cache_stats,
            "config": {
                "bm25_variant": self.config["bm25"]["variant"],
                "k1": self.config["bm25"]["k1"],
                "b": self.config["bm25"]["b"],
                "caching_enabled": self.config["performance"]["enable_caching"]
            }
        }
    
    def rebuild_index(self) -> bool:
        """Manually rebuild the search index"""
        try:
            logger.info("Manually rebuilding search index")
            self.index_manager.build_index()
            if self.cache:
                self.cache.clear()
            return True
        except Exception as e:
            logger.error("Failed to rebuild index", error=str(e))
            return False
    
    def clear_cache(self) -> bool:
        """Clear the search cache"""
        try:
            if self.cache:
                self.cache.clear()
                logger.info("Search cache cleared")
                return True
            return False
        except Exception as e:
            logger.error("Failed to clear cache", error=str(e))
            return False
    
    @lru_cache(maxsize=100)
    def get_available_section_types(self) -> List[str]:
        """Get list of available section types"""
        return list(set(doc.get('section_type', 'general') for doc in self.index_manager.documents))
    
    @lru_cache(maxsize=100)
    def get_available_node_types(self) -> List[str]:
        """Get list of available N8N node types"""
        node_types = set()
        for doc in self.index_manager.documents:
            node_type = doc.get('node_type')
            if node_type:
                node_types.add(node_type)
        return sorted(list(node_types))


# Global service instance (singleton pattern)
_search_service: Optional[BM25DocumentationSearch] = None


def get_search_service() -> BM25DocumentationSearch:
    """
    Get the global search service instance.
    
    This ensures we only have one search service instance across the application,
    which is important for performance since building the BM25 index is expensive.
    """
    global _search_service
    if _search_service is None:
        _search_service = BM25DocumentationSearch()
    return _search_service


# Convenience functions for common use cases
def search_docs(query: str) -> List[Dict[str, Any]]:
    """
    Simple search function that returns results as dictionaries.
    Uses default top_k from configuration.
    
    Args:
        query: Search query
        
    Returns:
        List of search results as dictionaries
    """
    service = get_search_service()
    results, _ = service.search(query)  # Uses config default
    return [result.to_dict() for result in results]


def search_integrations(query: str) -> List[Dict[str, Any]]:
    """
    Search specifically for N8N integrations.
    Uses default top_k from configuration.
    """
    service = get_search_service()
    results, _ = service.search(
        query, 
        filters={"section_type": "integration"}
    )
    return [result.to_dict() for result in results]


def search_concepts(query: str) -> List[Dict[str, Any]]:
    """
    Search specifically for N8N concepts and explanations.
    Uses default top_k from configuration.
    """
    service = get_search_service()
    results, _ = service.search(
        query, 
        filters={"section_type": "concept"}
    )
    return [result.to_dict() for result in results]
