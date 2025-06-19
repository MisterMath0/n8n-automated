"""
BM25 Search Models

Data structures and models for the BM25 search service.
"""

from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any
from datetime import datetime


@dataclass
class SearchResult:
    """
    Represents a single search result from the BM25 index.
    """
    title: str
    content: str
    url: str
    score: float
    section_type: str
    node_type: Optional[str] = None
    chunk_index: int = 0
    word_count: int = 0
    highlight: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)


@dataclass  
class SearchStats:
    """
    Statistics about a search operation.
    """
    query: str
    total_results: int
    search_time_ms: float
    results_returned: int
    cache_hit: bool = False
    index_size: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)
