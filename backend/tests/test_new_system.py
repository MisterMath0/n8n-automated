#!/usr/bin/env python3
"""
Test script for the new multi-step workflow generation system.
This script tests the basic functionality without requiring full app initialization.
"""

import asyncio
import sys
import os

# Add the backend directory to the path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, backend_dir)

async def test_schema_creation():
    """Test that the new schemas can be created"""
    print("Testing schema creation...")
    
    try:
        from app.utils.workflow_schemas import (
            create_workflow_plan_schema,
            create_workflow_nodes_schema, 
            create_workflow_connections_schema
        )
        
        plan_schema = create_workflow_plan_schema()
        nodes_schema = create_workflow_nodes_schema()
        connections_schema = create_workflow_connections_schema()
        
        print(f"✅ Plan schema created with {len(plan_schema['properties'])} properties")
        print(f"✅ Nodes schema created with {len(nodes_schema['properties'])} properties")
        print(f"✅ Connections schema created with {len(connections_schema['properties'])} properties")
        
        return True
        
    except Exception as e:
        print(f"❌ Schema creation failed: {e}")
        return False

async def test_tool_initialization():
    """Test that the new tools can be initialized"""
    print("\\nTesting tool initialization...")
    
    try:
        from app.services.tools.workflow_planner_tool import WorkflowPlannerTool
        from app.services.tools.node_generator_tool import NodeGeneratorTool
        from app.services.tools.connection_builder_tool import ConnectionBuilderTool
        from app.services.tools.workflow_orchestrator_tool import WorkflowOrchestratorTool
        
        planner = WorkflowPlannerTool()
        node_gen = NodeGeneratorTool()
        conn_builder = ConnectionBuilderTool()
        orchestrator = WorkflowOrchestratorTool()
        
        print(f"✅ WorkflowPlannerTool: {planner.name} - {planner.description[:50]}...")
        print(f"✅ NodeGeneratorTool: {node_gen.name} - {node_gen.description[:50]}...")
        print(f"✅ ConnectionBuilderTool: {conn_builder.name} - {conn_builder.description[:50]}...")
        print(f"✅ WorkflowOrchestratorTool: {orchestrator.name} - {orchestrator.description[:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Tool initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_ai_caller_service():
    """Test that the AI caller service can be created"""
    print("\\nTesting AI caller service...")
    
    try:
        # Mock client manager for testing
        class MockClientManager:
            def get_client_and_config(self, model):
                class MockConfig:
                    provider = "mock"
                    model_id = "test-model"
                return None, MockConfig()
        
        from app.services.tools.ai_caller_service import AICallerService
        
        mock_manager = MockClientManager()
        ai_caller = AICallerService(mock_manager)
        
        print("✅ AICallerService initialized successfully")
        return True
        
    except Exception as e:
        print(f"❌ AI caller service failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_tool_definitions():
    """Test that tool definitions can be created with new system"""
    print("\\nTesting tool definitions...")
    
    try:
        # Mock client manager
        class MockClientManager:
            def get_client_and_config(self, model):
                class MockConfig:
                    provider = "mock"
                    model_id = "test-model"
                return None, MockConfig()
        
        from app.services.tools.tool_definitions import ToolDefinitions
        
        mock_manager = MockClientManager()
        tool_defs = ToolDefinitions(client_manager=mock_manager)
        
        available_tools = tool_defs.get_available_tools()
        print(f"✅ ToolDefinitions created with tools: {available_tools}")
        
        # Test that workflow_generator is available
        if "workflow_generator" in available_tools:
            print("✅ workflow_generator tool is available")
        else:
            print("❌ workflow_generator tool is missing")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Tool definitions failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all tests"""
    print("🧪 Testing Multi-Step Workflow Generation System\\n")
    
    tests = [
        test_schema_creation,
        test_tool_initialization,
        test_ai_caller_service,
        test_tool_definitions
    ]
    
    results = []
    for test in tests:
        result = await test()
        results.append(result)
    
    print("\\n" + "="*50)
    print("📊 Test Results:")
    print(f"✅ Passed: {sum(results)}/{len(results)}")
    print(f"❌ Failed: {len(results) - sum(results)}/{len(results)}")
    
    if all(results):
        print("\\n🎉 All tests passed! The new system is ready.")
        return 0
    else:
        print("\\n💥 Some tests failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
