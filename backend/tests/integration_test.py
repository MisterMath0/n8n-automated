#!/usr/bin/env python3
"""
Integration test for the new multi-step workflow generation system.
Tests the actual workflow generation flow with mock AI responses.
"""

import asyncio
import json
import sys
import os
from unittest.mock import Mock, AsyncMock

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_dir)

async def test_mock_workflow_generation():
    """Test workflow generation with mocked AI calls"""
    print("Testing mock workflow generation...")
    
    try:
        from app.services.tools.workflow_orchestrator_tool import WorkflowOrchestratorTool
        from app.services.tools.ai_caller_service import AICallerService
        from app.models.conversation import ToolCall, ToolType
        from app.models.workflow import AIModel
        
        # Create mock client manager
        class MockClientManager:
            def get_client_and_config(self, model):
                class MockConfig:
                    provider = "mock"
                    model_id = "test-model"
                return None, MockConfig()
        
        # Create mock AI caller that returns predefined responses
        class MockAICallerService:
            def __init__(self, client_manager):
                self.client_manager = client_manager
                self.call_count = 0
            
            async def call_with_schema(self, prompt, schema, model):
                self.call_count += 1
                
                # Return different responses based on the schema type
                if "workflow_name" in schema.get("properties", {}):
                    # This is the workflow planner call
                    return {
                        "workflow_name": "Test Email to Slack Workflow",
                        "workflow_description": "Sends email notifications to Slack when triggered",
                        "trigger_type": "webhook",
                        "node_sequence": ["Webhook Trigger", "Process Email", "Send to Slack"],
                        "data_flow_description": "Webhook receives email data, processes it, sends to Slack",
                        "required_integrations": ["webhook", "slack"]
                    }
                elif "nodes" in schema.get("properties", {}):
                    # This is the node generator call
                    return {
                        "nodes": [
                            {
                                "id": "webhook-1",
                                "name": "Webhook Trigger",
                                "type": "n8n-nodes-base.webhook",
                                "position": [100, 100],
                                "parameters": {"httpMethod": "POST"},
                                "credentials": {}
                            },
                            {
                                "id": "set-1", 
                                "name": "Process Email",
                                "type": "n8n-nodes-base.set",
                                "position": [300, 100],
                                "parameters": {"values": {"string": [{"name": "message", "value": "{{ $json.subject }}"}]}},
                                "credentials": {}
                            },
                            {
                                "id": "slack-1",
                                "name": "Send to Slack", 
                                "type": "n8n-nodes-base.slack",
                                "position": [500, 100],
                                "parameters": {"channel": "#general", "text": "{{ $node.Process Email.json.message }}"},
                                "credentials": {"slackApi": {"id": "1", "name": "Slack API"}}
                            }
                        ]
                    }
                elif "connections" in schema.get("properties", {}):
                    # This is the connection builder call
                    return {
                        "connections": [
                            {
                                "source_node": "Webhook Trigger",
                                "target_node": "Process Email",
                                "connection_type": "main",
                                "source_index": 0,
                                "target_index": 0
                            },
                            {
                                "source_node": "Process Email", 
                                "target_node": "Send to Slack",
                                "connection_type": "main",
                                "source_index": 0,
                                "target_index": 0
                            }
                        ]
                    }
                else:
                    # Fallback
                    return {"error": "Unknown schema type"}
        
        # Create orchestrator with mock AI caller
        orchestrator = WorkflowOrchestratorTool()
        mock_ai_caller = MockAICallerService(MockClientManager())
        orchestrator.set_ai_caller(mock_ai_caller)
        
        # Create test tool call
        test_call = ToolCall(
            name=ToolType.WORKFLOW_GENERATOR,
            parameters={
                "description": "Create a workflow that receives email webhooks and sends notifications to Slack",
                "search_docs_first": False  # Skip doc search for this test
            },
            id="test-call-1"
        )
        
        # Execute workflow generation
        print("   Executing workflow generation...")
        result = await orchestrator.execute_with_model(test_call, AIModel.GEMINI_2_5_FLASH)
        
        if result.success:
            workflow_data = result.result.get("workflow")
            print(f"✅ Workflow generated successfully!")
            print(f"   Workflow name: {workflow_data.get('name')}")
            print(f"   Nodes: {len(workflow_data.get('nodes', []))}")
            print(f"   Connections: {len(workflow_data.get('connections', {}))}")
            print(f"   Generation time: {result.result.get('generation_time', 0):.2f}s")
            print(f"   AI calls made: {mock_ai_caller.call_count}")
            
            # Validate workflow structure
            if (workflow_data.get('name') and 
                workflow_data.get('nodes') and 
                workflow_data.get('connections') and
                workflow_data.get('id') and
                workflow_data.get('versionId')):
                print("✅ Workflow has all required fields")
                return True
            else:
                print("❌ Workflow missing required fields")
                return False
        else:
            print(f"❌ Workflow generation failed: {result.error}")
            return False
            
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_tool_orchestration():
    """Test that tools can be orchestrated together"""
    print("\\nTesting tool orchestration...")
    
    try:
        from app.services.tools.workflow_planner_tool import WorkflowPlannerTool
        from app.services.tools.node_generator_tool import NodeGeneratorTool
        from app.services.tools.connection_builder_tool import ConnectionBuilderTool
        from app.models.conversation import ToolCall, ToolType
        from app.models.workflow import AIModel
        
        # Test that tools can be chained together
        planner = WorkflowPlannerTool()
        node_gen = NodeGeneratorTool()
        conn_builder = ConnectionBuilderTool()
        
        # Mock AI caller
        class MockAICallerService:
            async def call_with_schema(self, prompt, schema, model):
                if "workflow_name" in schema.get("properties", {}):
                    return {
                        "workflow_name": "Test Workflow",
                        "trigger_type": "manual",
                        "node_sequence": ["Manual Trigger", "Set Data"],
                        "required_integrations": ["manual"]
                    }
                elif "nodes" in schema.get("properties", {}):
                    return {
                        "nodes": [
                            {"id": "1", "name": "Manual Trigger", "type": "n8n-nodes-base.manualTrigger", "position": [0, 0], "parameters": {}, "credentials": {}},
                            {"id": "2", "name": "Set Data", "type": "n8n-nodes-base.set", "position": [200, 0], "parameters": {}, "credentials": {}}
                        ]
                    }
                else:
                    return {"connections": []}
        
        mock_ai_caller = MockAICallerService()
        
        # Set AI caller for all tools
        planner.set_ai_caller(mock_ai_caller)
        node_gen.set_ai_caller(mock_ai_caller)
        conn_builder.set_ai_caller(mock_ai_caller)
        
        # Test planner
        plan_call = ToolCall(name=ToolType.WORKFLOW_PLANNER, parameters={"user_description": "test"}, id="plan-1")
        plan_result = await planner.execute_with_model(plan_call, AIModel.GEMINI_2_5_FLASH)
        
        if plan_result.success:
            print("✅ Planner tool working")
            
            # Test node generator
            nodes_call = ToolCall(
                name=ToolType.NODE_GENERATOR, 
                parameters={"workflow_plan": plan_result.result["workflow_plan"]}, 
                id="nodes-1"
            )
            nodes_result = await node_gen.execute_with_model(nodes_call, AIModel.GEMINI_2_5_FLASH)
            
            if nodes_result.success:
                print("✅ Node generator tool working")
                
                # Test connection builder
                conn_call = ToolCall(
                    name=ToolType.CONNECTION_BUILDER,
                    parameters={
                        "workflow_plan": plan_result.result["workflow_plan"],
                        "generated_nodes": nodes_result.result["nodes"]
                    },
                    id="conn-1"
                )
                conn_result = await conn_builder.execute_with_model(conn_call, AIModel.GEMINI_2_5_FLASH)
                
                if conn_result.success:
                    print("✅ Connection builder tool working")
                    print("✅ All tools can be orchestrated together")
                    return True
                else:
                    print(f"❌ Connection builder failed: {conn_result.error}")
                    return False
            else:
                print(f"❌ Node generator failed: {nodes_result.error}")
                return False
        else:
            print(f"❌ Planner failed: {plan_result.error}")
            return False
            
    except Exception as e:
        print(f"❌ Tool orchestration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_tool_definitions_integration():
    """Test that tool definitions work with the new system"""
    print("\\nTesting tool definitions integration...")
    
    try:
        from app.services.tools.tool_definitions import ToolDefinitions
        
        # Mock client manager
        class MockClientManager:
            def get_client_and_config(self, model):
                class MockConfig:
                    provider = "mock"
                return None, MockConfig()
        
        mock_manager = MockClientManager()
        tool_defs = ToolDefinitions(client_manager=mock_manager)
        
        # Check that workflow_generator is available
        available_tools = tool_defs.get_available_tools()
        if "workflow_generator" in available_tools:
            print("✅ workflow_generator tool registered")
            
            # Get the actual tool
            workflow_tool = tool_defs.get_tool_by_name("workflow_generator")
            if workflow_tool and hasattr(workflow_tool, '_ai_caller'):
                print("✅ Tool has AI caller service")
                
                # Test tool definition formats
                anthropic_tools = tool_defs.get_anthropic_tools()
                openai_tools = tool_defs.get_openai_tools()
                google_tools = tool_defs.convert_tools_to_google_format()
                
                print(f"✅ Tool definitions created for all providers")
                print(f"   Anthropic: {len(anthropic_tools)} tools")
                print(f"   OpenAI: {len(openai_tools)} tools")
                print(f"   Google: {len(google_tools)} tools")
                
                return True
            else:
                print("❌ Tool missing AI caller")
                return False
        else:
            print("❌ workflow_generator tool not found")
            return False
            
    except Exception as e:
        print(f"❌ Tool definitions integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all integration tests"""
    print("🧪 Integration Testing Multi-Step Workflow Generation\\n")
    
    tests = [
        test_mock_workflow_generation,
        test_tool_orchestration,
        test_tool_definitions_integration
    ]
    
    results = []
    for test in tests:
        try:
            result = await test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
            results.append(False)
    
    print("\\n" + "="*60)
    print("📊 Integration Test Results:")
    print(f"✅ Passed: {sum(results)}/{len(results)}")
    print(f"❌ Failed: {len(results) - sum(results)}/{len(results)}")
    
    if all(results):
        print("\\n🎉 All integration tests passed!")
        print("\\n✨ The new multi-step workflow generation system is working!")
        print("\\n📝 Ready for:")
        print("   • Testing with real AI providers")
        print("   • End-to-end system integration")
        print("   • Production deployment")
        return 0
    else:
        print("\\n💥 Some integration tests failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
