"""
Text Processing Utilities for BM25 Search

Handles tokenization, normalization, and preprocessing of text for search indexing.
"""

import re
from typing import List, Dict, Any


class TextProcessor:
    """
    Handles text preprocessing for BM25 search indexing.
    
    This includes tokenization, normalization, stopword removal, and basic stemming.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.stopwords = self._load_stopwords()
    
    def _load_stopwords(self) -> set:
        """Load common English stopwords"""
        return {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'you', 'your', 'this', 'have', 'had',
            'what', 'when', 'where', 'who', 'which', 'why', 'how', 'can', 'could',
            'should', 'would', 'do', 'does', 'did', 'shall', 'may', 'might',
            'but', 'or', 'not', 'no', 'all', 'any', 'both', 'each', 'few', 'more',
            'most', 'other', 'some', 'such', 'only', 'own', 'same', 'so', 'than',
            'too', 'very', 'just', 'now', 'also', 'here', 'there', 'then', 'they'
        }
    
    def preprocess_text(self, text: str) -> List[str]:
        """
        Preprocess text for BM25 indexing.
        
        Args:
            text: Raw text to preprocess
            
        Returns:
            List of processed tokens
        """
        if not text:
            return []
        
        # Convert to lowercase if configured
        if self.config["lowercase"]:
            text = text.lower()
        
        # Basic tokenization - split on whitespace and punctuation
        # This regex keeps alphanumeric characters, hyphens, and underscores
        tokens = re.findall(r'\b[a-zA-Z0-9_-]+\b', text)
        
        # Filter by length
        min_length = self.config["min_word_length"]
        max_length = self.config["max_word_length"]
        tokens = [t for t in tokens if min_length <= len(t) <= max_length]
        
        # Remove stopwords if configured
        if self.config["remove_stopwords"]:
            tokens = self._remove_stopwords(tokens)
        
        # Apply stemming if configured
        if self.config["enable_stemming"]:
            tokens = self._apply_basic_stemming(tokens)
        
        return tokens
    
    def _remove_stopwords(self, tokens: List[str]) -> List[str]:
        """Remove common stopwords from token list"""
        return [token for token in tokens if token.lower() not in self.stopwords]
    
    def _apply_basic_stemming(self, tokens: List[str]) -> List[str]:
        """
        Apply basic stemming to tokens.
        
        This is a simple rule-based stemmer. For production use,
        consider using a proper stemming library like NLTK Porter Stemmer.
        """
        stemmed = []
        for token in tokens:
            # Remove common suffixes
            if token.endswith('ing') and len(token) > 5:
                token = token[:-3]
            elif token.endswith('ed') and len(token) > 4:
                token = token[:-2]
            elif token.endswith('er') and len(token) > 4:
                token = token[:-2]
            elif token.endswith('est') and len(token) > 5:
                token = token[:-3]
            elif token.endswith('ly') and len(token) > 4:
                token = token[:-2]
            elif token.endswith('s') and len(token) > 3 and not token.endswith('ss'):
                token = token[:-1]
            
            stemmed.append(token)
        
        return stemmed
    
    def create_highlight(self, content: str, query: str, max_length: int = 300) -> str:
        """
        Create a highlighted snippet of content showing query terms.
        
        Args:
            content: Full content text
            query: Search query
            max_length: Maximum length of highlight snippet
            
        Returns:
            Highlighted content snippet
        """
        if not content or not query:
            return content[:max_length] + ("..." if len(content) > max_length else "")
        
        # Get query terms
        query_terms = self.preprocess_text(query)
        if not query_terms:
            return content[:max_length] + ("..." if len(content) > max_length else "")
        
        content_lower = content.lower()
        
        # Find the best position to show snippet (first occurrence of any query term)
        best_pos = 0
        for term in query_terms:
            pos = content_lower.find(term.lower())
            if pos != -1:
                best_pos = max(0, pos - 50)  # Show some context before
                break
        
        # Extract snippet
        snippet = content[best_pos:best_pos + max_length]
        if best_pos > 0:
            snippet = "..." + snippet
        if best_pos + max_length < len(content):
            snippet = snippet + "..."
        
        # Basic highlighting (wrap query terms in **)
        for term in query_terms:
            pattern = f'\\b{re.escape(term)}\\b'
            snippet = re.sub(
                pattern,
                f'**{term}**',
                snippet,
                flags=re.IGNORECASE
            )
        
        return snippet
