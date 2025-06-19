#!/usr/bin/env python3
"""
N8N Documentation Scraper

Downloads N8N documentation from Apify API and processes it for BM25 search indexing.
Saves the processed documentation to backend/data/n8n_docs.json for use by the search service.

Usage:
    python scrape_docs.py [--force] [--output-file custom_output.json]
    
Environment Variables:
    APIFY_API_TOKEN: Required - Apify API token for accessing the documentation scraper
"""

import asyncio
import argparse
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import re
import json
import sys

import httpx
import structlog
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

# Setup logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


class ScraperSettings(BaseSettings):
    """Settings for the documentation scraper"""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )
    
    apify_api_token: Optional[str] = Field(default=None, alias="APIFY_API_TOKEN")
    
    def validate_required_settings(self) -> None:
        """Validate that required settings are present"""
        if not self.apify_api_token:
            raise ValueError("APIFY_API_TOKEN environment variable is required")


class DocSection(BaseModel):
    """Represents a documentation section for search indexing"""
    title: str = Field(..., description="Section title")
    content: str = Field(..., description="Section content")
    url: str = Field(..., description="Source URL")
    section_type: str = Field(default="general", description="Type: integration|concept|example|general")
    node_type: Optional[str] = Field(default=None, description="N8N node type if applicable")
    chunk_index: int = Field(default=0, description="Chunk index for large sections")
    word_count: int = Field(default=0, description="Word count of content")


class DocumentationData(BaseModel):
    """Complete documentation dataset"""
    sections: List[DocSection] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    total_sections: int = Field(default=0)
    last_updated: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class DocumentationScraper:
    """Handles downloading and processing N8N documentation from Apify"""
    
    APIFY_API_URL = "https://api.apify.com/v2/actor-tasks/mistermathde~n8n-documetation-scraper/runs/last/dataset/items"
    MAX_CHUNK_SIZE = 1000  # words per chunk
    MIN_CONTENT_LENGTH = 50  # minimum characters for a valid section
    
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.client = httpx.AsyncClient(timeout=60.0)
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""
            
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove navigation elements and common UI text
        navigation_patterns = [
            r'Skip to main content',
            r'Edit this page',
            r'Previous.*?Next',
            r'On this page',
            r'Table of contents',
            r'Search docs',
            r'© \d{4}.*?All rights reserved',
        ]
        
        for pattern in navigation_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        # Clean up extra spaces
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text

    def _extract_node_type(self, url: str, title: str, content: str) -> Optional[str]:
        """Extract N8N node type from URL, title, or content"""
        # Check URL patterns
        if '/integrations/' in url:
            # Extract node name from URL like /integrations/slack/ -> Slack
            match = re.search(r'/integrations/([^/]+)/', url)
            if match:
                return match.group(1).title()
        
        # Check title patterns
        node_patterns = [
            r'^([A-Z][a-zA-Z0-9\s]+) node$',
            r'^([A-Z][a-zA-Z0-9\s]+) integration$',
            r'^Using ([A-Z][a-zA-Z0-9\s]+)$',
        ]
        
        for pattern in node_patterns:
            match = re.search(pattern, title)
            if match:
                return match.group(1).strip()
        
        return None

    def _determine_section_type(self, url: str, title: str) -> str:
        """Determine the type of documentation section"""
        url_lower = url.lower()
        title_lower = title.lower()
        
        if '/integrations/' in url_lower:
            return 'integration'
        elif any(keyword in url_lower for keyword in ['/core-concepts/', '/fundamentals/']):
            return 'concept'
        elif any(keyword in url_lower for keyword in ['/examples/', '/tutorials/', '/workflows/']):
            return 'example'
        elif any(keyword in url_lower for keyword in ['/flow-logic/', '/data/']):
            return 'concept'
        elif any(keyword in title_lower for keyword in ['example', 'tutorial', 'guide']):
            return 'example'
        else:
            return 'general'

    def _chunk_content(self, content: str, max_words: int = MAX_CHUNK_SIZE) -> List[str]:
        """Split large content into smaller chunks for better search performance"""
        words = content.split()
        
        if len(words) <= max_words:
            return [content]
        
        chunks = []
        current_chunk = []
        current_size = 0
        
        for word in words:
            current_chunk.append(word)
            current_size += 1
            
            # Try to break at sentence boundaries
            if current_size >= max_words * 0.8 and word.endswith(('.', '!', '?')):
                chunks.append(' '.join(current_chunk))
                current_chunk = []
                current_size = 0
            elif current_size >= max_words:
                chunks.append(' '.join(current_chunk))
                current_chunk = []
                current_size = 0
        
        # Add remaining content
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks

    async def _download_raw_data(self) -> List[Dict[str, Any]]:
        """Download raw documentation data from Apify API"""
        logger.info("Starting documentation download from Apify API")
        
        try:
            response = await self.client.get(
                self.APIFY_API_URL,
                params={"token": self.api_token}
            )
            response.raise_for_status()
            
            data = response.json()
            logger.info("Successfully downloaded documentation", item_count=len(data))
            return data
            
        except httpx.HTTPError as e:
            logger.error("Failed to download documentation from Apify", error=str(e))
            raise
        except json.JSONDecodeError as e:
            logger.error("Failed to parse Apify response as JSON", error=str(e))
            raise

    def _process_raw_item(self, item: Dict[str, Any]) -> List[DocSection]:
        """Process a single raw documentation item into sections"""
        url = item.get('url', '')
        raw_text = item.get('text', '')
        
        if not url or not raw_text:
            logger.warning("Skipping item with missing URL or text", url=url)
            return []
        
        # Clean the text
        cleaned_text = self._clean_text(raw_text)
        
        if len(cleaned_text) < self.MIN_CONTENT_LENGTH:
            logger.debug("Skipping item with too little content", url=url, length=len(cleaned_text))
            return []
        
        # Extract title (usually first line or from URL)
        lines = cleaned_text.split('\n')
        title = lines[0].strip() if lines else url.split('/')[-1].replace('-', ' ').title()
        
        # Remove title from content to avoid duplication
        if len(lines) > 1:
            content = '\n'.join(lines[1:]).strip()
        else:
            content = cleaned_text
        
        # Determine section metadata
        section_type = self._determine_section_type(url, title)
        node_type = self._extract_node_type(url, title, content)
        
        # Chunk content if it's too large
        chunks = self._chunk_content(content)
        
        sections = []
        for i, chunk in enumerate(chunks):
            word_count = len(chunk.split())
            
            section = DocSection(
                title=title if i == 0 else f"{title} (Part {i+1})",
                content=chunk,
                url=url,
                section_type=section_type,
                node_type=node_type,
                chunk_index=i,
                word_count=word_count
            )
            sections.append(section)
        
        return sections

    async def process_documentation(self) -> DocumentationData:
        """Download and process all documentation"""
        logger.info("Starting documentation processing")
        
        # Download raw data
        raw_items = await self._download_raw_data()
        
        # Process items into sections
        all_sections = []
        processed_count = 0
        skipped_count = 0
        
        for item in raw_items:
            try:
                sections = self._process_raw_item(item)
                all_sections.extend(sections)
                processed_count += 1
            except Exception as e:
                logger.warning("Failed to process documentation item", url=item.get('url'), error=str(e))
                skipped_count += 1
        
        # Create final dataset
        documentation = DocumentationData(
            sections=all_sections,
            metadata={
                "source": "apify_n8n_documentation_scraper",
                "apify_url": self.APIFY_API_URL,
                "raw_items_count": len(raw_items),
                "processed_items_count": processed_count,
                "skipped_items_count": skipped_count,
                "total_word_count": sum(section.word_count for section in all_sections),
                "section_types": {
                    section_type: len([s for s in all_sections if s.section_type == section_type])
                    for section_type in set(s.section_type for s in all_sections)
                }
            },
            total_sections=len(all_sections)
        )
        
        logger.info(
            "Documentation processing completed",
            total_sections=len(all_sections),
            processed_items=processed_count,
            skipped_items=skipped_count,
            total_words=documentation.metadata["total_word_count"]
        )
        
        return documentation


async def main():
    """Main function to run the documentation scraper"""
    parser = argparse.ArgumentParser(description="Download and process N8N documentation")
    parser.add_argument("--force", action="store_true", help="Force download even if output file exists")
    parser.add_argument("--output-file", default="n8n_docs.json", help="Output filename (default: n8n_docs.json)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.dev.ConsoleRenderer(colors=True)
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            logger_factory=structlog.stdlib.LoggerFactory(),
            level="DEBUG"
        )
    
    # Load and validate settings
    try:
        settings = ScraperSettings()
        settings.validate_required_settings()
        logger.info("Settings loaded successfully", token_present=bool(settings.apify_api_token))
    except Exception as e:
        logger.error("Failed to load settings", error=str(e))
        return 1
    
    # Setup paths
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / "data"
    output_path = data_dir / args.output_file
    
    # Check if output exists and force flag
    if output_path.exists() and not args.force:
        logger.info("Output file already exists. Use --force to overwrite", path=str(output_path))
        return 0
    
    try:
        # Create data directory if it doesn't exist
        data_dir.mkdir(exist_ok=True)
        
        # Run the scraper
        async with DocumentationScraper(settings.apify_api_token) as scraper:
            documentation = await scraper.process_documentation()
        
        # Save to file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(documentation.model_dump(), f, indent=2, ensure_ascii=False)
        
        logger.info(
            "Documentation saved successfully",
            path=str(output_path),
            sections=documentation.total_sections,
            size_mb=round(output_path.stat().st_size / 1024 / 1024, 2)
        )
        
        # Print summary
        print(f"\n✅ Documentation scraping completed successfully!")
        print(f"📄 Total sections: {documentation.total_sections}")
        print(f"📊 Total words: {documentation.metadata['total_word_count']:,}")
        print(f"💾 Saved to: {output_path}")
        print(f"📏 File size: {round(output_path.stat().st_size / 1024 / 1024, 2)} MB")
        
        print(f"\n📋 Section types:")
        for section_type, count in documentation.metadata['section_types'].items():
            print(f"  - {section_type}: {count}")
        
        return 0
        
    except Exception as e:
        logger.error("Documentation scraping failed", error=str(e))
        return 1


if __name__ == "__main__":
    exit(asyncio.run(main()))
