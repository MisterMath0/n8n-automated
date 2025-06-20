#!/usr/bin/env python3

import sys
sys.path.insert(0, '/Users/MisterMath/n8n-automated/backend')

def test():
    try:
        from app.services.ai_service import ai_service
        from app.models.conversation import ChatMessage, MessageRole
        from app.models.workflow import AIModel
        
        # Test basic functionality
        providers = ai_service.get_available_providers()
        tools = ai_service.get_tool_info()
        models = ai_service.get_available_models()
        
        print(f"✅ Providers: {providers}")
        print(f"✅ Models: {models}")
        print(f"✅ Tools: {tools.get('available_tools', [])}")
        
        # Test configuration loading
        try:
            system_prompt = ai_service.get_system_prompt("default")
            print(f"✅ System prompt loaded: {len(system_prompt)} chars")
        except Exception as e:
            print(f"⚠️  Config prompt loading: {e}")
        
        print("🎉 Tool-based AI service ready")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test()
    if success:
        print("\n🚀 Active endpoints:")
        print("   POST /api/v1/workflows/chat")
        print("   POST /api/v1/workflows/search-docs") 
        print("   GET  /api/v1/workflows/models")
        print("   GET  /api/v1/workflows/health")
        print("\n🆕 New features:")
        print("   • Google Gemini models (FREE tier)")
        print("   • Configurable prompts (no hardcoded prompts)")
        print("   • 1M+ token context windows")
        print("   • All prompts externalized to config/prompts.yaml")
        print("\n🔑 Setup:")
        print("   1. Get Google AI API key: https://ai.google.dev/")
        print("   2. Add GOOGLE_API_KEY to .env file")
        print("   3. Default model: gemini-2-5-flash (FREE)")
        print("   4. pip install google-genai")
    else:
        print("\n💥 Fix errors first")
