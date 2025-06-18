import json
from typing import Dict, List, Tuple, Any, Optional
from ..models.workflow import N8NWorkflow, N8NNode


class WorkflowValidator:
    def __init__(self):
        self.required_node_types = {
            "n8n-nodes-base.webhook",
            "n8n-nodes-base.manualTrigger",
            "n8n-nodes-base.slack",
            "n8n-nodes-base.gmail",
            "n8n-nodes-base.httpRequest",
            "n8n-nodes-base.set",
            "n8n-nodes-base.if",
            "n8n-nodes-base.code"
        }
    
    def validate_workflow(self, workflow: N8NWorkflow) -> Tuple[bool, List[str]]:
        errors = []
        
        if not workflow.name or len(workflow.name.strip()) == 0:
            errors.append("Workflow name is required")
        
        if len(workflow.nodes) == 0:
            errors.append("Workflow must have at least one node")
        
        node_names = set()
        for node in workflow.nodes:
            if not node.name or len(node.name.strip()) == 0:
                errors.append(f"Node {node.id} missing name")
            
            if node.name in node_names:
                errors.append(f"Duplicate node name: {node.name}")
            node_names.add(node.name)
            
            if not node.type:
                errors.append(f"Node {node.name} missing type")
        
        connection_errors = self._validate_connections(workflow)
        errors.extend(connection_errors)
        
        return len(errors) == 0, errors
    
    def _validate_connections(self, workflow: N8NWorkflow) -> List[str]:
        errors = []
        node_names = {node.name for node in workflow.nodes}
        
        for source_name, connections in workflow.connections.items():
            if source_name not in node_names:
                errors.append(f"Connection source '{source_name}' not found in nodes")
            
            if "main" in connections:
                for connection_group in connections["main"]:
                    for connection in connection_group:
                        target_name = connection.node
                        if target_name not in node_names:
                            errors.append(f"Connection target '{target_name}' not found in nodes")
        
        return errors
    
    def validate_json_structure(self, json_str: str) -> Tuple[bool, Optional[str]]:
        try:
            json.loads(json_str)
            return True, None
        except json.JSONDecodeError as e:
            return False, f"Invalid JSON: {str(e)}"


workflow_validator = WorkflowValidator()
