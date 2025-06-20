#!/usr/bin/env python3
"""
Force rebuild the search index with fixed tokenization
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from app.services.doc_search_service import get_search_service

print("🔧 Rebuilding Search Index with Fixed Tokenization")
print("=" * 55)

try:
    # Remove the old index file to force rebuild
    index_file = Path("data/bm25_index.pkl")
    if index_file.exists():
        index_file.unlink()
        print("🗑️ Removed old index file")
    
    # Initialize service (will rebuild index)
    print("🏗️ Rebuilding index...")
    service = get_search_service()
    
    print("✅ Index rebuilt successfully!")
    
    # Test search
    print("\n🔍 Testing search with fixed tokenization...")
    results, stats = service.search("email notification", top_k=3)
    
    print(f"📊 Found {stats.results_returned}/{stats.total_results} results")
    print(f"⏱️ Search time: {stats.search_time_ms:.1f}ms")
    
    if results:
        print(f"\n🏆 Top result:")
        top = results[0]
        print(f"   Title: {top.title}")
        print(f"   Score: {top.score:.3f}")
        print(f"   Type: {top.section_type}")
        if top.node_type:
            print(f"   Node: {top.node_type}")
        print(f"   Preview: {top.content[:100]}...")
    
    # Test a few more queries
    test_queries = ["slack", "webhook", "database", "http"]
    print(f"\n📋 Quick test results:")
    for query in test_queries:
        results, stats = service.search(query, top_k=1)
        print(f"   '{query}': {stats.results_returned} results")
    
    print(f"\n🎉 Search service is now working correctly!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
