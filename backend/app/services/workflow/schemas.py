"""
Simplified workflow schemas for multi-step generation.
These schemas are designed to work reliably across all AI providers.
"""

from typing import Dict, Any


def create_workflow_plan_schema() -> Dict[str, Any]:
    """Simple workflow planning schema"""
    return {
        "type": "object",
        "properties": {
            "workflow_name": {
                "type": "string",
                "description": "Clear descriptive name for the workflow"
            },
            "workflow_description": {
                "type": "string", 
                "description": "Brief description of what the workflow does"
            },
            "trigger_type": {
                "type": "string",
                "enum": ["webhook", "schedule", "manual", "email", "slack", "telegram"],
                "description": "Type of trigger that starts the workflow"
            },
            "node_sequence": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Ordered list of node names representing the workflow flow"
            },
            "data_flow_description": {
                "type": "string",
                "description": "Description of how data flows through the workflow"
            },
            "required_integrations": {
                "type": "array", 
                "items": {"type": "string"},
                "description": "List of services/integrations needed (e.g., gmail, slack, webhook)"
            }
        },
        "required": ["workflow_name", "trigger_type", "node_sequence", "required_integrations"]
    }


def create_workflow_nodes_schema() -> Dict[str, Any]:
    """Simple nodes generation schema"""
    return {
        "type": "object",
        "properties": {
            "nodes": {
                "type": "array",
                "items": {
                    "type": "object", 
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string"},
                        "type": {"type": "string"},
                        "position": {
                            "type": "array",
                            "items": {"type": "integer"},
                            "minItems": 2,
                            "maxItems": 2
                        },
                        "parameters": {"type": "object"},
                        "credentials": {"type": "object"}
                    },
                    "required": ["id", "name", "type", "position"]
                }
            }
        },
        "required": ["nodes"]
    }


def create_workflow_connections_schema() -> Dict[str, Any]:
    """Simple connections schema"""
    return {
        "type": "object",
        "properties": {
            "connections": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "source_node": {"type": "string"},
                        "target_node": {"type": "string"}, 
                        "connection_type": {"type": "string", "default": "main"},
                        "source_index": {"type": "integer", "default": 0},
                        "target_index": {"type": "integer", "default": 0}
                    },
                    "required": ["source_node", "target_node"]
                }
            }
        },
        "required": ["connections"]
    }
