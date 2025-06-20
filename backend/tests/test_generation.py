import asyncio
import json
from app.services.ai_service import ai_service
from app.models.workflow import AIModel


async def test_workflow_generation():
    print("Testing N8N AI Workflow Generator...")
    
    try:
        providers = ai_service.get_available_providers()
        print(f"Available providers: {providers}")
        
        if not any(providers.values()):
            print("❌ No providers available. Check your API keys in .env file.")
            return
        
        print("🧪 Testing workflow generation...")
        
        workflow, generation_time, tokens_used = await ai_service.generate_workflow(
            description="Create a simple webhook that receives data and sends it to Slack",
            model=AIModel.GPT_4O,
            temperature=0.3
        )
        
        print(f"✅ Workflow generated successfully!")
        print(f"   Name: {workflow.name}")
        print(f"   Nodes: {len(workflow.nodes)}")
        print(f"   Generation time: {generation_time:.2f}s")
        print(f"   Tokens used: {tokens_used}")
        
        print(f"📋 Generated workflow preview:")
        for node in workflow.nodes:
            print(f"   - {node.name} ({node.type})")
        
        print(f"🔗 Connections: {len(workflow.connections)}")
        
        print("🧪 Testing workflow editing...")
        edited_workflow, edit_time, edit_tokens, changes = await ai_service.edit_workflow(
            workflow=workflow,
            edit_instruction="Add a Set node to format the data before sending to Slack",
            model=AIModel.GPT_4O
        )
        
        print(f"✅ Workflow edited successfully!")
        print(f"   Edit time: {edit_time:.2f}s")
        print(f"   Tokens used: {edit_tokens}")
        print(f"   Changes made: {changes}")
        
        print("✅ All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")


if __name__ == "__main__":
    asyncio.run(test_workflow_generation())
