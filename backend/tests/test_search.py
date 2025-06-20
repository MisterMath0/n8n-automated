#!/usr/bin/env python3
"""
Test script for the BM25 search service
"""

import sys
from pathlib import Path
import asyncio

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from app.services.doc_search_service import get_search_service, search_docs


def test_search_service():
    """Test the BM25 search service"""
    print("🔍 Testing BM25 Search Service")
    print("=" * 50)
    
    try:
        # Initialize the search service
        print("1. Initializing search service...")
        service = get_search_service()
        
        # Get service stats
        stats = service.get_stats()
        print(f"✅ Service initialized!")
        print(f"📊 Documents indexed: {stats['index']['document_count']}")
        print(f"🗂️ Index file size: {stats['index']['index_file_size_mb']} MB")
        print(f"⚙️ BM25 variant: {stats['config']['bm25_variant']}")
        print(f"💾 Caching enabled: {stats['config']['caching_enabled']}")
        
        # Test searches
        test_queries = [
            "send email notification",
            "slack integration",
            "http request",
            "database connection",
            "webhook trigger"
        ]
        
        print(f"\n2. Testing search queries...")
        for i, query in enumerate(test_queries, 1):
            print(f"\n🔍 Query {i}: '{query}'")
            
            results, search_stats = service.search(query, top_k=3)
            
            print(f"   📈 Results: {search_stats.results_returned}/{search_stats.total_results}")
            print(f"   ⏱️ Search time: {search_stats.search_time_ms:.1f}ms")
            print(f"   💾 Cache hit: {search_stats.cache_hit}")
            
            if results:
                print(f"   🏆 Top result: '{results[0].title}' (score: {results[0].score:.3f})")
                print(f"       Type: {results[0].section_type}")
                if results[0].node_type:
                    print(f"       Node: {results[0].node_type}")
            else:
                print("   ❌ No results found")
        
        # Test convenience functions
        print(f"\n3. Testing convenience functions...")
        
        # Test integration search
        integration_results = search_docs("email", top_k=2)
        print(f"📧 Email integrations found: {len(integration_results)}")
        
        # Get available types
        section_types = service.get_available_section_types()
        node_types = service.get_available_node_types()
        
        print(f"📋 Available section types: {section_types}")
        print(f"🔌 Available node types: {len(node_types)} total")
        print(f"    Examples: {node_types[:5]}...")
        
        # Test cache performance
        print(f"\n4. Testing cache performance...")
        
        # First search (cache miss)
        results1, stats1 = service.search("gmail", top_k=1)
        print(f"   First search: {stats1.search_time_ms:.1f}ms (cache: {stats1.cache_hit})")
        
        # Second search (cache hit)
        results2, stats2 = service.search("gmail", top_k=1)
        print(f"   Second search: {stats2.search_time_ms:.1f}ms (cache: {stats2.cache_hit})")
        
        if stats2.cache_hit and stats2.search_time_ms < stats1.search_time_ms:
            print("   ✅ Cache is working and improving performance!")
        
        print(f"\n✅ All tests completed successfully!")
        print(f"🎉 BM25 search service is ready to use!")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_search_service()
    exit(0 if success else 1)
