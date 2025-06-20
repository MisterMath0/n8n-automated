#!/usr/bin/env python3
"""
Debug script to understand why BM25 search returns no results
"""

import sys
from pathlib import Path
import json

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from app.services.doc_search_service import get_search_service
from app.services.text_processor import TextProcessor
from app.core.config_loader import config_loader


def debug_search_issue():
    """Debug why search returns no results"""
    print("🔍 Debugging BM25 Search Issue")
    print("=" * 50)
    
    try:
        # Load search config
        config = config_loader.load_search_config()
        text_processor = TextProcessor(config["text_processing"])
        
        # Check a few sample documents
        print("1. Examining sample documents...")
        data_file = Path("data/n8n_docs.json")
        
        with open(data_file, 'r') as f:
            data = json.load(f)
        
        sections = data['sections'][:5]  # First 5 documents
        
        for i, doc in enumerate(sections):
            print(f"\n📄 Document {i+1}:")
            print(f"   Title: {doc.get('title', 'NO TITLE')[:60]}...")
            print(f"   Content length: {len(doc.get('content', ''))}")
            print(f"   Content preview: {doc.get('content', 'NO CONTENT')[:100]}...")
            print(f"   Section type: {doc.get('section_type', 'NO TYPE')}")
            print(f"   Node type: {doc.get('node_type', 'None')}")
            
            # Test tokenization
            title = doc.get('title', '')
            content = doc.get('content', '')
            combined_text = ' '.join([title] * 2 + [content])
            
            tokens = text_processor.preprocess_text(combined_text)
            print(f"   Tokens ({len(tokens)}): {tokens[:10]}...")
        
        print(f"\n2. Testing text preprocessing...")
        test_queries = [
            "send email notification",
            "slack integration", 
            "http request",
            "webhook"
        ]
        
        for query in test_queries:
            tokens = text_processor.preprocess_text(query)
            print(f"   Query: '{query}' → Tokens: {tokens}")
        
        print(f"\n3. Checking BM25 index directly...")
        service = get_search_service()
        
        # Check if documents have any tokens
        print(f"   Total documents: {len(service.index_manager.documents)}")
        print(f"   Total document tokens: {len(service.index_manager.document_tokens)}")
        
        # Check some document tokens
        for i in range(min(3, len(service.index_manager.document_tokens))):
            doc_tokens = service.index_manager.document_tokens[i]
            print(f"   Doc {i} tokens ({len(doc_tokens)}): {doc_tokens[:10]}...")
        
        # Test raw BM25 scoring
        print(f"\n4. Testing raw BM25 scoring...")
        test_query = "email"
        query_tokens = text_processor.preprocess_text(test_query)
        print(f"   Query tokens: {query_tokens}")
        
        if query_tokens and service.index_manager.retriever:
            scores = service.index_manager.retriever.get_scores(query_tokens)
            print(f"   Raw scores shape: {scores.shape}")
            print(f"   Max score: {scores.max()}")
            print(f"   Min score: {scores.min()}")
            print(f"   Non-zero scores: {(scores > 0).sum()}")
            
            # Find top scoring docs
            if scores.max() > 0:
                top_indices = scores.argsort()[-5:][::-1]
                print(f"   Top 5 scoring docs:")
                for idx in top_indices:
                    if scores[idx] > 0:
                        doc = service.index_manager.documents[idx]
                        print(f"     Doc {idx}: score={scores[idx]:.4f}, title='{doc.get('title', 'NO TITLE')[:50]}...'")
        
        print(f"\n5. Checking configuration...")
        print(f"   Lowercase: {config['text_processing']['lowercase']}")
        print(f"   Remove stopwords: {config['text_processing']['remove_stopwords']}")
        print(f"   Min word length: {config['text_processing']['min_word_length']}")
        print(f"   Max word length: {config['text_processing']['max_word_length']}")
        print(f"   Min score threshold: {config['search_behavior']['min_score_threshold']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Debug failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    debug_search_issue()
