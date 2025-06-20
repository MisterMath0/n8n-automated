#!/usr/bin/env python3
"""
Quick test to verify the Apify API endpoint works with our token
"""

import sys
from pathlib import Path
import asyncio

# Add the backend directory to Python path so we can import the scraper
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from scripts.scrape_docs import DocumentationScraper, ScraperSettings

async def test_api():
    # Load settings using BaseSettings
    try:
        settings = ScraperSettings()
        settings.validate_required_settings()
        print(f"🔑 Using API token: {settings.apify_api_token[:10]}...")
    except Exception as e:
        print(f"❌ Settings error: {e}")
        return False
    
    try:
        async with DocumentationScraper(settings.apify_api_token) as scraper:
            print("📡 Testing API connection...")
            raw_items = await scraper._download_raw_data()
            
            print(f"✅ API connection successful!")
            print(f"📊 Total items downloaded: {len(raw_items)}")
            
            if raw_items:
                first_item = raw_items[0]
                print(f"📄 First item URL: {first_item.get('url', 'N/A')}")
                text_preview = first_item.get('text', '')[:200]
                print(f"📝 Text preview: {text_preview}...")
                print(f"🔍 Available fields: {list(first_item.keys())}")
            
            return True
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_api())
    exit(0 if success else 1)
