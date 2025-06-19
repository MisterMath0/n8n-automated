# BM25 Documentation Search Service

A comprehensive, configurable BM25 search service for N8N documentation with caching, filtering, and performance optimization.

## 🏗️ Architecture Overview

The search service is built with a modular architecture:

```
📁 app/services/
├── 📄 search_models.py      # Data structures (SearchResult, SearchStats)
├── 📄 search_cache.py       # Caching with TTL support
├── 📄 text_processor.py     # Text preprocessing & highlighting
├── 📄 bm25_index.py         # Index management (build/load/save)
└── 📄 doc_search_service.py # Main service orchestrator

📁 config/
└── 📄 search.yaml           # Configuration file
```

## 🚀 Quick Start

### 1. Basic Usage

```python
from app.services.doc_search_service import get_search_service

# Get the search service (singleton)
search_service = get_search_service()

# Search for documentation
results, stats = search_service.search("send email notification", top_k=5)

for result in results:
    print(f"Title: {result.title}")
    print(f"Score: {result.score:.3f}")
    print(f"Type: {result.section_type}")
    print(f"URL: {result.url}")
    print(f"Highlight: {result.highlight}")
    print("-" * 40)
```

### 2. Convenience Functions

```python
from app.services.doc_search_service import search_docs, search_integrations

# Simple search returning dictionaries
results = search_docs("webhook trigger", top_k=3)

# Search only integrations
integrations = search_integrations("slack", top_k=5)
```

### 3. Advanced Filtering

```python
# Filter by section type
results, stats = search_service.search(
    "database connection",
    top_k=10,
    filters={"section_type": "integration"}
)

# Filter by node type
results, stats = search_service.search(
    "send message",
    filters={"node_type": "Slack"}
)

# Multiple filters
results, stats = search_service.search(
    "query",
    filters={
        "section_type": "concept",
        "min_score": 0.5
    }
)
```

## ⚙️ Configuration

The search service is highly configurable via `config/search.yaml`:

### BM25 Algorithm Parameters

```yaml
search:
  bm25:
    k1: 1.2              # Term frequency saturation (0.5-2.0)
    b: 0.75              # Document length normalization (0.0-1.0)
    variant: "lucene"    # Algorithm variant (lucene, robertson, atire, bm25l, bm25+)
    delta: 1.0           # For bm25+ and bm25l variants only
```

**Understanding BM25 Parameters:**

- **k1**: Controls how much term frequency matters
  - Higher values (1.5-2.0) = More weight to repeated terms
  - Lower values (0.5-1.0) = Less emphasis on repetition
  - Default 1.2 works well for most use cases

- **b**: Controls document length normalization
  - Higher values (0.7-1.0) = Penalize longer documents more
  - Lower values (0.0-0.3) = Treat all documents more equally
  - Default 0.75 provides balanced results

### Text Processing

```yaml
text_processing:
  lowercase: true              # Convert to lowercase
  remove_stopwords: true       # Remove common words (a, the, is)
  enable_stemming: false       # Reduce words to root form
  min_word_length: 2          # Ignore very short words
  max_word_length: 50         # Ignore very long words
```

### Search Behavior

```yaml
search_behavior:
  default_top_k: 5            # Default number of results
  max_top_k: 50              # Maximum allowed results
  min_score_threshold: 0.0    # Minimum relevance score
  
  # Boost different content types
  section_type_weights:
    integration: 1.2          # N8N integrations (most important)
    concept: 1.0             # Core concepts
    example: 0.9             # Examples and tutorials
    general: 0.8             # General documentation
  
  node_type_boost: 1.3       # Boost when query matches node type
```

### Performance & Caching

```yaml
performance:
  enable_caching: true        # Cache search results
  cache_size: 1000           # Max cached queries
  cache_ttl: 3600            # Cache expiration (seconds)
  enable_parallel_processing: true
  num_workers: 4
```

## 🧠 How BM25 Works

BM25 (Best Matching 25) is a probabilistic ranking function that scores documents based on:

### 1. Term Frequency (TF)
How often search terms appear in a document:
- More occurrences = higher relevance
- But with diminishing returns (saturation)

### 2. Inverse Document Frequency (IDF)
How rare/common terms are across all documents:
- Rare terms = more discriminative = higher weight
- Common terms = less useful = lower weight

### 3. Document Length Normalization
Adjusts for document length:
- Prevents long documents from dominating
- Maintains fairness across different content sizes

### 4. Final Score Calculation
```
BM25(query, doc) = Σ(IDF(term) × TF(term, doc) × (k1 + 1)) / 
                    (TF(term, doc) + k1 × (1 - b + b × |doc|/avgdl))
```

Where:
- `TF(term, doc)` = Term frequency in document
- `IDF(term)` = Inverse document frequency
- `|doc|` = Document length
- `avgdl` = Average document length
- `k1`, `b` = Tuning parameters

## 📊 Performance Features

### Intelligent Indexing
- **Auto-rebuild**: Detects when documentation is updated
- **Persistent storage**: Saves index to disk for faster startup
- **Configuration hashing**: Rebuilds when settings change

### Smart Caching
- **TTL-based**: Automatic cache expiration
- **LRU eviction**: Removes oldest items when full
- **Thread-safe**: Concurrent access support
- **Statistics**: Hit/miss ratios and performance metrics

### Text Processing Pipeline
1. **Tokenization**: Split text into meaningful terms
2. **Normalization**: Lowercase, length filtering
3. **Stopword removal**: Remove common words
4. **Stemming**: Reduce words to root forms (optional)
5. **Indexing**: Build BM25 term frequency matrices

## 🎯 Search Features

### Section Type Filtering
```python
# Search only integrations
results = search_integrations("email", top_k=5)

# Search only concepts  
results = search_concepts("workflow", top_k=5)

# Custom filter
results, stats = service.search(
    "tutorial", 
    filters={"section_type": "example"}
)
```

### Node Type Boosting
When you search for "slack message", results about the Slack node get automatically boosted.

### Highlighting
Search results include highlighted snippets showing query terms in context:

```python
result.highlight  # "Send **email** notifications using **Gmail** integration..."
```

## 🧪 Testing

### Run the Test Suite
```bash
cd /Users/MisterMath/n8n-automated/backend
python test_search.py
```

### Manual Testing
```python
from app.services.doc_search_service import get_search_service

service = get_search_service()

# Test basic search
results, stats = service.search("send email")
print(f"Found {len(results)} results in {stats.search_time_ms:.1f}ms")

# Test performance
stats = service.get_stats()
print(f"Cache hit ratio: {stats['search']['cache_hit_ratio']:.2f}")

# Test available types
print(f"Section types: {service.get_available_section_types()}")
print(f"Node types: {len(service.get_available_node_types())} available")
```

## 🔧 Troubleshooting

### Index Building Issues
```python
# Force rebuild index
service = get_search_service()
success = service.rebuild_index()
if success:
    print("Index rebuilt successfully")
```

### Cache Issues
```python
# Clear cache
service.clear_cache()

# Check cache stats
stats = service.get_stats()
print(stats['cache'])
```

### Configuration Issues
```python
# Check current config
stats = service.get_stats()
print(stats['config'])

# Verify file exists
from pathlib import Path
config_file = Path("config/search.yaml")
print(f"Config exists: {config_file.exists()}")
```

## 📈 Performance Tips

### 1. Tune BM25 Parameters
- **For integration-heavy queries**: Increase `k1` to 1.5-2.0
- **For concept queries**: Decrease `k1` to 0.8-1.0
- **For mixed content**: Keep default `k1=1.2`, `b=0.75`

### 2. Optimize Caching
- Increase `cache_size` for more cached queries
- Adjust `cache_ttl` based on documentation update frequency
- Monitor cache hit ratio in stats

### 3. Text Processing
- Enable stemming for broader matches
- Adjust word length filters for your content
- Customize stopwords for domain-specific terms

### 4. Section Weighting
- Boost integration results for user-facing queries
- Weight concepts higher for educational content
- Adjust node type boost for integration-specific searches

## 🔍 Search Quality Tips

### Query Formulation
- **Good**: "send email notification gmail"
- **Better**: "gmail send email trigger workflow"
- **Best**: Use specific node names and action verbs

### Understanding Results
- **High scores (>1.0)**: Very relevant matches
- **Medium scores (0.3-1.0)**: Moderately relevant
- **Low scores (<0.3)**: Weak matches, consider filtering

### Filtering Strategy
- Use `section_type` filters for targeted searches
- Apply `min_score` to improve result quality
- Combine filters for precise results

## 🎉 Summary

This BM25 search service provides:
- ✅ **Fast, accurate search** with proven BM25 algorithm
- ✅ **Highly configurable** via YAML configuration
- ✅ **Performance optimized** with caching and indexing
- ✅ **Easy to use** with simple and advanced APIs
- ✅ **Well documented** with examples and explanations
- ✅ **Modular design** for easy maintenance and extension

You now have a production-ready search service that can handle thousands of documents and queries efficiently!
