#!/usr/bin/env python3
"""
Simple verification script for the new multi-step workflow generation system.
"""

import sys
import os

def test_imports():
    """Test that all new modules can be imported"""
    print("Testing imports...")
    
    try:
        # Test schema imports
        from backend.app.utils.workflow_schemas import (
            create_workflow_plan_schema,
            create_workflow_nodes_schema,
            create_workflow_connections_schema
        )
        print("✅ Workflow schemas imported successfully")
        
        # Test AI caller service
        from backend.app.services.tools.ai_caller_service import AICallerService
        print("✅ AI caller service imported successfully")
        
        # Test new tools
        from backend.app.services.tools.workflow_planner_tool import WorkflowPlannerTool
        from backend.app.services.tools.node_generator_tool import NodeGeneratorTool
        from backend.app.services.tools.connection_builder_tool import ConnectionBuilderTool
        from backend.app.services.tools.workflow_orchestrator_tool import WorkflowOrchestratorTool
        print("✅ All new tools imported successfully")
        
        # Test updated models
        from backend.app.models.conversation import ToolType
        print("✅ Updated ToolType enum imported successfully")
        print(f"   Available tool types: {[t.value for t in ToolType]}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_schema_structure():
    """Test that schemas have the expected structure"""
    print("\\nTesting schema structure...")
    
    try:
        from backend.app.utils.workflow_schemas import (
            create_workflow_plan_schema,
            create_workflow_nodes_schema,
            create_workflow_connections_schema
        )
        
        plan_schema = create_workflow_plan_schema()
        nodes_schema = create_workflow_nodes_schema()
        connections_schema = create_workflow_connections_schema()
        
        # Check plan schema
        expected_plan_props = ["workflow_name", "trigger_type", "node_sequence", "required_integrations"]
        if all(prop in plan_schema["properties"] for prop in expected_plan_props):
            print("✅ Plan schema has all required properties")
        else:
            print("❌ Plan schema missing required properties")
            return False
        
        # Check nodes schema
        if "nodes" in nodes_schema["properties"]:
            print("✅ Nodes schema has nodes property")
        else:
            print("❌ Nodes schema missing nodes property")
            return False
        
        # Check connections schema
        if "connections" in connections_schema["properties"]:
            print("✅ Connections schema has connections property")
        else:
            print("❌ Connections schema missing connections property")
            return False
        
        print(f"   Plan schema: {len(plan_schema['properties'])} properties")
        print(f"   Nodes schema: {len(nodes_schema['properties'])} properties") 
        print(f"   Connections schema: {len(connections_schema['properties'])} properties")
        
        return True
        
    except Exception as e:
        print(f"❌ Schema structure test failed: {e}")
        return False

def test_tool_creation():
    """Test that tools can be created"""
    print("\\nTesting tool creation...")
    
    try:
        from backend.app.services.tools.workflow_planner_tool import WorkflowPlannerTool
        from backend.app.services.tools.node_generator_tool import NodeGeneratorTool
        from backend.app.services.tools.connection_builder_tool import ConnectionBuilderTool
        from backend.app.services.tools.workflow_orchestrator_tool import WorkflowOrchestratorTool
        
        planner = WorkflowPlannerTool()
        node_gen = NodeGeneratorTool()
        conn_builder = ConnectionBuilderTool()
        orchestrator = WorkflowOrchestratorTool()
        
        tools = [planner, node_gen, conn_builder, orchestrator]
        
        for tool in tools:
            if hasattr(tool, 'name') and hasattr(tool, 'description') and hasattr(tool, 'input_schema'):
                print(f"✅ {tool.__class__.__name__}: {tool.name}")
            else:
                print(f"❌ {tool.__class__.__name__}: missing required attributes")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Tool creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run verification tests"""
    print("🔍 Verifying Multi-Step Workflow Generation System\\n")
    
    # Add the current directory to Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)
    
    tests = [
        test_imports,
        test_schema_structure,
        test_tool_creation
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
            results.append(False)
    
    print("\\n" + "="*60)
    print("📊 Verification Results:")
    print(f"✅ Passed: {sum(results)}/{len(results)}")
    print(f"❌ Failed: {len(results) - sum(results)}/{len(results)}")
    
    if all(results):
        print("\\n🎉 All verifications passed! System structure looks good.")
        print("\\n📝 Next steps:")
        print("   1. Test with actual AI provider connections")
        print("   2. Test end-to-end workflow generation")
        print("   3. Verify database integration")
        return 0
    else:
        print("\\n💥 Some verifications failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
