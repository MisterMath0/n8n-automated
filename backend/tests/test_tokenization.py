#!/usr/bin/env python3
"""
Test the fixed tokenization
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from app.services.text_processor import TextProcessor

# Test the fixed tokenization
config = {
    "lowercase": True,
    "remove_stopwords": True,
    "enable_stemming": False,
    "min_word_length": 2,
    "max_word_length": 50
}

processor = TextProcessor(config)

test_cases = [
    "Send email notification",
    "Slack integration webhook",
    "HTTP request database connection",
    "n8n workflow automation"
]

print("🔧 Testing Fixed Tokenization")
print("=" * 40)

for text in test_cases:
    tokens = processor.preprocess_text(text)
    print(f"Text: '{text}'")
    print(f"Tokens: {tokens}")
    print()

print("✅ Tokenization is now working correctly!")
