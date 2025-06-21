#!/usr/bin/env python3
"""
Simple test script to verify the messages API endpoints are working correctly.
This tests the backend messages API we just created.
"""

import sys
import json
from pathlib import Path

# Add the backend app directory to Python path
backend_path = Path(__file__).parent / "backend" / "app"
sys.path.insert(0, str(backend_path))

try:
    from fastapi.testclient import TestClient
    from main import app
    
    # Create test client
    client = TestClient(app)
    
    print("🧪 Testing N8N AI Messages API Endpoints")
    print("=" * 50)
    
    # Test 1: Welcome message endpoint
    print("\n📋 Test 1: Welcome Message Endpoint")
    response = client.get("/api/v1/messages/welcome")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS - Welcome message received")
        print(f"📄 Content: {data['content'][:100]}...")
        print(f"🎯 Type: {data['type']}")
        print(f"👤 Sender: {data['sender']}")
    else:
        print(f"❌ FAILED - Expected 200, got {response.status_code}")
        print(f"📄 Response: {response.text}")
    
    # Test 2: Capabilities endpoint
    print("\n📋 Test 2: Capabilities Endpoint")
    response = client.get("/api/v1/messages/capabilities")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS - Capabilities received")
        print(f"📄 Content: {data['content'][:100]}...")
    else:
        print(f"❌ FAILED - Expected 200, got {response.status_code}")
    
    # Test 3: Response templates endpoint
    print("\n📋 Test 3: Response Templates Endpoint")
    response = client.get("/api/v1/messages/templates")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS - Templates received")
        print(f"📄 Available templates: {list(data.keys())}")
    else:
        print(f"❌ FAILED - Expected 200, got {response.status_code}")
    
    # Test 4: System prompts endpoint
    print("\n📋 Test 4: System Prompts Endpoint")
    response = client.get("/api/v1/messages/system-prompts")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS - System prompts received")
        print(f"📄 Available prompts: {list(data.keys())}")
    else:
        print(f"❌ FAILED - Expected 200, got {response.status_code}")
    
    # Test 5: Contextual message endpoint
    print("\n📋 Test 5: Contextual Message Endpoint")
    response = client.get("/api/v1/messages/contextual?context=welcome&user_name=TestUser")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS - Contextual message received")
        print(f"📄 Content: {data['content'][:100]}...")
        print(f"🎯 Context: {data['context']}")
    else:
        print(f"❌ FAILED - Expected 200, got {response.status_code}")
    
    # Test 6: Health check endpoint
    print("\n📋 Test 6: Health Check Endpoint")
    response = client.get("/api/v1/messages/health")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS - Health check passed")
        print(f"📊 Status: {data['status']}")
        print(f"📄 Prompts loaded: {data['prompts_loaded']}")
        print(f"🔧 Available contexts: {data['available_contexts']}")
    else:
        print(f"❌ FAILED - Expected 200, got {response.status_code}")
    
    print("\n🎉 All API endpoint tests completed!")
    print("=" * 50)
    
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("💡 Make sure you have FastAPI installed: pip install fastapi[all]")
except Exception as e:
    print(f"❌ Unexpected Error: {e}")
    print(f"💡 Make sure the backend is properly configured")
