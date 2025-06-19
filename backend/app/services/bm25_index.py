"""
BM25 Index Manager

Handles building, loading, and saving of the BM25 search index.
"""

import json
import pickle
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib

import structlog
import bm25s

from .text_processor import TextProcessor

logger = structlog.get_logger()


class BM25IndexManager:
    """
    Manages the BM25 search index including building, loading, and saving.
    """
    
    def __init__(self, config: Dict[str, Any], data_dir: Path):
        self.config = config
        self.data_dir = data_dir
        self.docs_file = data_dir / "n8n_docs.json"
        self.index_file = data_dir / config["index"]["index_file"]
        
        # Text processor
        self.text_processor = TextProcessor(config["text_processing"])
        
        # Index components
        self.retriever: Optional[bm25s.BM25] = None
        self.documents: List[Dict[str, Any]] = []
        self.document_tokens: List[List[str]] = []
        self.index_timestamp: Optional[datetime] = None
    
    def should_rebuild_index(self) -> bool:
        """Determine if the index should be rebuilt"""
        # Always rebuild if auto_rebuild is disabled
        if not self.config["index"]["auto_rebuild"]:
            return True
        
        # Rebuild if index file doesn't exist
        if not self.index_file.exists():
            logger.info("Index file does not exist, will build new index")
            return True
        
        # Rebuild if documentation is newer than index
        if self.docs_file.exists():
            docs_mtime = datetime.fromtimestamp(self.docs_file.stat().st_mtime)
            index_mtime = datetime.fromtimestamp(self.index_file.stat().st_mtime)
            if docs_mtime > index_mtime:
                logger.info("Documentation is newer than index, rebuilding")
                return True
        
        return False
    
    def load_documentation(self) -> List[Dict[str, Any]]:
        """Load and validate documentation from JSON file"""
        if not self.docs_file.exists():
            raise FileNotFoundError(f"Documentation file not found: {self.docs_file}")
        
        try:
            with open(self.docs_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not isinstance(data, dict) or 'sections' not in data:
                raise ValueError("Invalid documentation format: missing 'sections' key")
            
            sections = data['sections']
            if not isinstance(sections, list):
                raise ValueError("Invalid documentation format: 'sections' must be a list")
            
            logger.info(
                "Documentation loaded",
                total_sections=len(sections),
                file_size_mb=round(self.docs_file.stat().st_size / 1024 / 1024, 2)
            )
            
            return sections
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in documentation file: {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to load documentation: {e}")
    
    def build_index(self):
        """Build the BM25 index from documentation"""
        start_time = time.time()
        
        # Load documentation
        self.documents = self.load_documentation()
        
        # Preprocess documents
        logger.info("Preprocessing documents for BM25 indexing")
        self.document_tokens = []
        
        field_weights = self.config.get('field_weights', {})
        title_weight = int(field_weights.get('title_weight', 2.0))
        
        for i, doc in enumerate(self.documents):
            # Combine title and content for indexing
            title = doc.get('title', '')
            content = doc.get('content', '')
            
            # Weight title more heavily by including it multiple times
            combined_text = ' '.join([title] * title_weight + [content])
            
            tokens = self.text_processor.preprocess_text(combined_text)
            self.document_tokens.append(tokens)
            
            if self.config["logging"]["log_index_building"] and i % 100 == 0:
                logger.debug(f"Processed {i + 1}/{len(self.documents)} documents")
        
        # Create BM25 retriever
        bm25_config = self.config["bm25"]
        
        # Handle different variants and their parameters
        variant = bm25_config["variant"]
        k1 = bm25_config["k1"]
        b = bm25_config["b"]
        
        if variant in ["bm25+", "bm25l"]:
            # BM25+ and BM25L require delta parameter
            delta = bm25_config.get("delta", 1.0)
            self.retriever = bm25s.BM25(
                method=variant,
                k1=k1,
                b=b,
                delta=delta
            )
        else:
            # Standard variants (lucene, robertson, atire)
            self.retriever = bm25s.BM25(
                method=variant,
                k1=k1,
                b=b
            )
        
        # Index the documents
        logger.info("Building BM25 index")
        self.retriever.index(self.document_tokens)
        
        # Save index if configured
        if self.config["index"]["save_index"]:
            self.save_index()
        
        self.index_timestamp = datetime.now()
        build_time = time.time() - start_time
        
        avg_tokens = sum(len(tokens) for tokens in self.document_tokens) / len(self.document_tokens)
        
        logger.info(
            "BM25 index built successfully",
            document_count=len(self.documents),
            build_time_seconds=round(build_time, 2),
            avg_tokens_per_doc=round(avg_tokens, 1)
        )
    
    def save_index(self):
        """Save the BM25 index to disk for faster loading next time"""
        try:
            index_data = {
                'retriever': self.retriever,
                'documents': self.documents,
                'document_tokens': self.document_tokens,
                'timestamp': datetime.now(),
                'config_hash': self._get_config_hash()
            }
            
            with open(self.index_file, 'wb') as f:
                pickle.dump(index_data, f)
            
            logger.info(
                "Index saved to disk",
                file_path=str(self.index_file),
                file_size_mb=round(self.index_file.stat().st_size / 1024 / 1024, 2)
            )
            
        except Exception as e:
            logger.warning("Failed to save index to disk", error=str(e))
    
    def load_index(self):
        """Load the BM25 index from disk"""
        try:
            with open(self.index_file, 'rb') as f:
                index_data = pickle.load(f)
            
            # Verify config hasn't changed significantly
            if index_data.get('config_hash') != self._get_config_hash():
                logger.info("Configuration changed, rebuilding index")
                self.build_index()
                return
            
            self.retriever = index_data['retriever']
            self.documents = index_data['documents']
            self.document_tokens = index_data['document_tokens']
            self.index_timestamp = index_data['timestamp']
            
            logger.info(
                "Index loaded from disk",
                document_count=len(self.documents),
                index_age_hours=round((datetime.now() - self.index_timestamp).total_seconds() / 3600, 1)
            )
            
        except Exception as e:
            logger.warning("Failed to load index from disk, rebuilding", error=str(e))
            self.build_index()
    
    def _get_config_hash(self) -> str:
        """Get a hash of the relevant configuration for cache invalidation"""
        relevant_config = {
            'bm25': self.config['bm25'],
            'text_processing': self.config['text_processing'],
            'field_weights': self.config.get('field_weights', {})
        }
        config_str = json.dumps(relevant_config, sort_keys=True)
        return hashlib.md5(config_str.encode()).hexdigest()
