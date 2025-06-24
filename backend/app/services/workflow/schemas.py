"""
Simplified workflow schemas for multi-step generation.
These schemas are designed to work reliably across all AI providers.
"""

from typing import Dict, Any


def create_workflow_plan_schema() -> Dict[str, Any]:
    """Enhanced workflow planning schema with flexible pattern recognition"""
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
                "description": "Type of trigger that starts the workflow (webhook, schedule, manual, email, etc.)"
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
            },
            "processing_pattern": {
                "type": "string",
                "description": "Describe the data flow pattern (e.g., 'parallel API calls with merge by index', 'nested split in batches', 'sequential with conditional branching', 'sub-workflow execution', etc.)"
            },
            "batching_requirements": {
                "type": "object",
                "description": "Batching details if needed",
                "properties": {
                    "needs_batching": {"type": "boolean"},
                    "batch_size": {"type": "integer"},
                    "reason": {"type": "string"}
                }
            },
            "parallel_operations": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of operations that should run in parallel based on N8N capabilities"
            },
            "merge_configuration": {
                "type": "object", 
                "description": "How to merge data streams using N8N merge node options",
                "properties": {
                    "merge_mode": {"type": "string"},
                    "merge_reasoning": {"type": "string"}
                }
            },
            "complexity_indicators": {
                "type": "object",
                "description": "Workflow complexity markers",
                "properties": {
                    "has_loops": {"type": "boolean"},
                    "has_parallel_branches": {"type": "boolean"},
                    "has_data_merging": {"type": "boolean"},
                    "estimated_node_count": {"type": "integer"}
                }
            }
        },
        "required": ["workflow_name", "trigger_type", "node_sequence", "required_integrations", "processing_pattern"]
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
                        "parameters": {
                            "description": "Node-specific configuration parameters based on N8N node type documentation (can be any structure)"
                        },
                        "credentials": {
                            "description": "Credential references for the node (leave empty if none needed)"
                        }
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
                        "source_node": {
                            "type": "string",
                            "description": "Name of the source node (use 'name' field from nodes, not 'id')"
                        },
                        "target_node": {
                            "type": "string",
                            "description": "Name of the target node (use 'name' field from nodes, not 'id')"
                        }, 
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
