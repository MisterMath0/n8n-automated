# Documentation Scraper

This script downloads N8N documentation from Apify and processes it for BM25 search indexing.

## Setup

1. Make sure you have the Apify API token in your environment:
   ```bash
   export APIFY_API_TOKEN=""
   ```

   Or add it to your `.env` file:
   ```
   APIFY_API_TOKEN=""
   ```

## Usage

### Basic usage:
```bash
cd backend
python scripts/scrape_docs.py
```

### With options:
```bash
# Force overwrite existing file
python scripts/scrape_docs.py --force

# Custom output filename
python scripts/scrape_docs.py --output-file custom_docs.json

# Verbose logging
python scripts/scrape_docs.py --verbose

# Combine options
python scripts/scrape_docs.py --force --verbose --output-file latest_docs.json
```

## Output

The script creates `/backend/data/n8n_docs.json` with the following structure:

```json
{
  "sections": [
    {
      "title": "Section Title",
      "content": "Section content...",
      "url": "https://docs.n8n.io/...",
      "section_type": "integration|concept|example|general",
      "node_type": "NodeName",
      "chunk_index": 0,
      "word_count": 150
    }
  ],
  "metadata": {
    "source": "apify_n8n_documentation_scraper",
    "total_word_count": 50000,
    "section_types": {
      "integration": 120,
      "concept": 45,
      "example": 30
    }
  },
  "total_sections": 195,
  "last_updated": "2025-06-19T..."
}
```

## Features

- **Smart chunking**: Large documents are split into searchable chunks
- **Content cleaning**: Removes navigation elements and normalizes text
- **Type detection**: Automatically categorizes content (integration, concept, example)
- **Node extraction**: Identifies N8N node types from URLs and content
- **Comprehensive logging**: Tracks processing statistics and errors
- **Incremental updates**: Only downloads if forced or file doesn't exist

## Scheduling

For production, you can schedule this script to run weekly:

```bash
# Add to crontab (runs every Sunday at 3 AM)
0 3 * * 0 cd /path/to/backend && python scripts/scrape_docs.py --force
```
