"""
Enhanced utilities for structured output and JSON schema validation for AI models.

This module provides provider-specific schema definitions and validation utilities 
for ensuring AI models generate valid JSON that conforms to our Pydantic models.
"""

import uuid
import json
import re
from typing import Dict, Any, Optional
import structlog

from ..models.workflow import N8NWorkflow

logger = structlog.get_logger()


def create_n8n_workflow_schema() -> Dict[str, Any]:
    """
    Create OpenAPI 3.0 schema for N8N workflows compatible with OpenAI function calling.
    
    Returns:
        Dict containing the OpenAPI schema for N8N workflows
    """
    return {
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Human-readable name for the workflow"
            },
            "nodes": {
                "type": "array",
                "description": "Array of N8N nodes in the workflow",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Generate a proper UUID v4 format like 'a1b2c3d4-e5f6-4789-9012-34567890abcd'"
                        },
                        "name": {
                            "type": "string", 
                            "description": "Unique name for the node"
                        },
                        "type": {
                            "type": "string",
                            "description": "N8N node type (e.g., 'n8n-nodes-base.webhook')"
                        },
                        "typeVersion": {
                            "type": "number",
                            "description": "Version of the node type",
                            "nullable": True
                        },
                        "position": {
                            "type": "array",
                            "description": "X, Y coordinates for visual positioning",
                            "items": {"type": "integer"},
                            "minItems": 2,
                            "maxItems": 2
                        },
                        "parameters": {
                            "type": "object",
                            "description": "Node-specific configuration parameters",
                            "additionalProperties": True
                        },
                        "credentials": {
                            "type": "object", 
                            "description": "Credential references for the node",
                            "additionalProperties": True
                        },
                        "webhookId": {
                            "type": "string",
                            "description": "Webhook ID for webhook nodes",
                            "nullable": True
                        }
                    },
                    "required": ["id", "name", "type", "position"]
                }
            },
            "connections": {
                "type": "object",
                "description": "Node connections mapping",
                "additionalProperties": {
                    "type": "object",
                    "additionalProperties": {
                        "type": "array",
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "node": {"type": "string"},
                                    "type": {"type": "string"},
                                    "index": {"type": "integer"}
                                },
                                "required": ["node", "type", "index"]
                            }
                        }
                    }
                }
            },
            "active": {
                "type": "boolean",
                "description": "Whether the workflow is active"
            },
            "settings": {
                "type": "object",
                "description": "Workflow execution settings",
                "additionalProperties": True
            },
            "id": {
                "type": "string", 
                "description": "Generate a proper UUID v4 format"
            },
            "versionId": {
                "type": "string",
                "description": "Generate a proper UUID v4 format"
            },
            "tags": {
                "type": "array",
                "description": "Tags for categorizing the workflow",
                "items": {"type": "string"}
            }
        },
        "required": ["name", "nodes", "connections", "active", "versionId", "id", "tags"]
    }


def create_gemini_n8n_workflow_schema() -> Dict[str, Any]:
    """
    Create schema specifically optimized for Google Gemini structured output.
    
    This schema addresses Gemini's specific handling of nested structures and
    provides better compatibility with response_schema parameter.
    
    Returns:
        Dict containing the Gemini-optimized schema for N8N workflows
    """
    return {
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Human-readable name for the workflow"
            },
            "nodes": {
                "type": "array",
                "description": "Array of N8N nodes in the workflow",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "UUID v4 format like 'a1b2c3d4-e5f6-4789-9012-34567890abcd'"
                        },
                        "name": {
                            "type": "string", 
                            "description": "Unique descriptive name for the node"
                        },
                        "type": {
                            "type": "string",
                            "description": "N8N node type like 'n8n-nodes-base.gmail' or 'n8n-nodes-base.slack'"
                        },
                        "typeVersion": {
                            "type": "number",
                            "description": "Version of the node type, usually 1 or 2"
                        },
                        "position": {
                            "type": "array",
                            "description": "Visual position as [x, y] coordinates",
                            "items": {"type": "integer"},
                            "minItems": 2,
                            "maxItems": 2
                        },
                        "parameters": {
                            "type": "object",
                            "description": "Node configuration parameters as key-value pairs",
                            "additionalProperties": True
                        },
                        "credentials": {
                            "type": "object", 
                            "description": "Credential mappings for authentication",
                            "additionalProperties": True
                        }
                    },
                    "required": ["id", "name", "type", "position"]
                }
            },
            "connections": {
                "type": "object",
                "description": "Node connections - each key is a source node name",
                "additionalProperties": {
                    "type": "object",
                    "description": "Output connections from the source node",
                    "properties": {
                        "main": {
                            "type": "array",
                            "description": "Main output connections (array of output groups)",
                            "items": {
                                "type": "array",
                                "description": "Group of connections from this output",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "node": {
                                            "type": "string",
                                            "description": "Name of the target node to connect to"
                                        },
                                        "type": {
                                            "type": "string",
                                            "description": "Connection type, usually 'main'"
                                        },
                                        "index": {
                                            "type": "integer",
                                            "description": "Input index on target node, usually 0"
                                        }
                                    },
                                    "required": ["node", "type", "index"]
                                }
                            }
                        }
                    },
                    "required": ["main"]
                }
            },
            "active": {
                "type": "boolean",
                "description": "Whether the workflow is active"
            },
            "settings": {
                "type": "object",
                "description": "Workflow settings like execution order",
                "properties": {
                    "executionOrder": {
                        "type": "string",
                        "description": "Execution order version, usually 'v1'"
                    }
                }
            },
            "id": {
                "type": "string", 
                "description": "Workflow UUID in format 'a1b2c3d4-e5f6-4789-9012-34567890abcd'"
            },
            "versionId": {
                "type": "string",
                "description": "Version UUID in format 'a1b2c3d4-e5f6-4789-9012-34567890abcd'"
            },
            "tags": {
                "type": "array",
                "description": "Array of tag strings for categorization",
                "items": {"type": "string"}
            }
        },
        "required": ["name", "nodes", "connections", "active", "versionId", "id", "tags"]
    }


def validate_and_fix_connections(connections: Any) -> Dict[str, Dict[str, Any]]:
    """
    Validate and fix connections format for n8n compatibility.
    
    N8N expects: Dict[str, Dict[str, List[List[Dict]]]]
    But LLMs sometimes generate: Dict[str, Dict[str, Dict]] or other formats
    
    Args:
        connections: Raw connections data from AI model
        
    Returns:
        Fixed connections in proper n8n format
    """
    if not isinstance(connections, dict):
        logger.warning("Connections is not a dict, defaulting to empty")
        return {}
    
    fixed_connections = {}
    
    for source_node, outputs in connections.items():
        if not isinstance(outputs, dict):
            logger.warning(f"Outputs for {source_node} is not a dict, skipping")
            continue
            
        fixed_outputs = {}
        
        for output_type, targets in outputs.items():
            if not isinstance(targets, list):
                # Handle single connection object - convert to proper format
                if isinstance(targets, dict) and "node" in targets:
                    logger.info(f"Converting single connection to list format for {source_node}.{output_type}")
                    fixed_outputs[output_type] = [[targets]]
                else:
                    logger.warning(f"Invalid targets format for {source_node}.{output_type}, defaulting to empty")
                    fixed_outputs[output_type] = []
            else:
                # Handle list of connections
                fixed_targets = []
                for i, target_group in enumerate(targets):
                    if isinstance(target_group, list):
                        # Already correct format - validate each connection
                        valid_connections = []
                        for conn in target_group:
                            if isinstance(conn, dict) and all(k in conn for k in ["node", "type", "index"]):
                                valid_connections.append({
                                    "node": str(conn["node"]),
                                    "type": str(conn.get("type", "main")),
                                    "index": int(conn.get("index", 0))
                                })
                        if valid_connections:
                            fixed_targets.append(valid_connections)
                    elif isinstance(target_group, dict) and "node" in target_group:
                        # Single connection, wrap in list
                        logger.info(f"Wrapping single connection in list for {source_node}.{output_type}[{i}]")
                        fixed_targets.append([{
                            "node": str(target_group["node"]),
                            "type": str(target_group.get("type", "main")),
                            "index": int(target_group.get("index", 0))
                        }])
                    else:
                        logger.warning(f"Invalid target group format for {source_node}.{output_type}[{i}], skipping")
                
                fixed_outputs[output_type] = fixed_targets
                
        if fixed_outputs:
            fixed_connections[source_node] = fixed_outputs
    
    return fixed_connections


def validate_and_fix_workflow_data(workflow_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate workflow data and fix common issues.
    
    Args:
        workflow_data: Raw workflow data from AI
        
    Returns:
        Fixed workflow data ready for Pydantic validation
        
    Raises:
        ValueError: If workflow data cannot be fixed
    """
    if not isinstance(workflow_data, dict):
        raise ValueError(f"Workflow data must be a dictionary, got {type(workflow_data)}")
    
    # Ensure required fields exist with proper defaults
    if "id" not in workflow_data or not workflow_data["id"] or workflow_data["id"] in ["workflow_id", "uuid", ""]:
        workflow_data["id"] = str(uuid.uuid4())
    if "versionId" not in workflow_data or not workflow_data["versionId"] or workflow_data["versionId"] in ["version_id", "uuid", ""]:
        workflow_data["versionId"] = str(uuid.uuid4())
    if "tags" not in workflow_data:
        workflow_data["tags"] = []
    if "active" not in workflow_data:
        workflow_data["active"] = False
    if "nodes" not in workflow_data:
        workflow_data["nodes"] = []
    if "name" not in workflow_data or not workflow_data["name"]:
        workflow_data["name"] = "Generated Workflow"
    if "settings" not in workflow_data:
        workflow_data["settings"] = {"executionOrder": "v1"}

    # Fix connections format
    if "connections" in workflow_data:
        workflow_data["connections"] = validate_and_fix_connections(workflow_data["connections"])
    else:
        workflow_data["connections"] = {}
    
    # Ensure all nodes have required fields
    for i, node in enumerate(workflow_data.get("nodes", [])):
        if not isinstance(node, dict):
            logger.warning(f"Node {i} is not a dict, skipping")
            continue
            
        if "id" not in node or not node["id"]:
            node["id"] = str(uuid.uuid4())
        if "position" not in node:
            node["position"] = [i * 200, 100]  # Spread nodes horizontally
        if "parameters" not in node:
            node["parameters"] = {}
        if "credentials" not in node:
            node["credentials"] = {}
        
        # Ensure parameters and credentials are objects, not strings
        if isinstance(node["parameters"], str):
            try:
                node["parameters"] = json.loads(node["parameters"]) if node["parameters"].strip() else {}
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse parameters for node {node.get('name', i)}, defaulting to empty")
                node["parameters"] = {}
        
        if isinstance(node["credentials"], str):
            try:
                node["credentials"] = json.loads(node["credentials"]) if node["credentials"].strip() else {}
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse credentials for node {node.get('name', i)}, defaulting to empty")
                node["credentials"] = {}
    
    return workflow_data


def extract_json_from_response(response_text: str) -> str:
    """
    Extract JSON from AI response, handling markdown blocks and extra text.
    
    Args:
        response_text: Raw response text from AI model
        
    Returns:
        Extracted JSON string
    """
    response_text = response_text.strip()
    
    # Try to find JSON in markdown code blocks
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
    if json_match:
        return json_match.group(1)
    
    # Try to find JSON object directly
    json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
    if json_match:
        return json_match.group(1)
    
    # If no JSON found, return the original text
    return response_text


def parse_workflow_with_recovery(workflow_json_str: str) -> N8NWorkflow:
    """
    Parse workflow JSON with automatic recovery and validation.
    
    Args:
        workflow_json_str: JSON string from AI model
        
    Returns:
        Validated N8NWorkflow instance
        
    Raises:
        ValueError: If workflow cannot be parsed or validated
    """
    try:
        # First attempt: direct JSON parsing
        workflow_data = json.loads(workflow_json_str)
    except json.JSONDecodeError:
        try:
            # Second attempt: extract JSON from response
            extracted_json = extract_json_from_response(workflow_json_str)
            workflow_data = json.loads(extracted_json)
        except json.JSONDecodeError as e:
            logger.error("Failed to parse workflow JSON", error=str(e), raw_response=workflow_json_str[:500])
            raise ValueError(f"Invalid JSON in workflow response: {str(e)}")
    
    # Validate and fix workflow data
    try:
        workflow_data = validate_and_fix_workflow_data(workflow_data)
        workflow = N8NWorkflow(**workflow_data)
        
        logger.info(
            "Successfully parsed workflow",
            workflow_name=workflow.name,
            nodes_count=len(workflow.nodes),
            connections_count=sum(len(outputs.get("main", [])) for outputs in workflow.connections.values())
        )
        
        return workflow
    except Exception as e:
        logger.error("Failed to validate workflow data", error=str(e), workflow_keys=list(workflow_data.keys()) if isinstance(workflow_data, dict) else type(workflow_data))
        raise ValueError(f"Failed to create valid workflow: {str(e)}")


def get_schema_for_provider(provider: str) -> Dict[str, Any]:
    """
    Get the appropriate schema for the specified provider.
    
    Args:
        provider: The LLM provider ('google', 'openai', 'anthropic', etc.)
        
    Returns:
        Provider-optimized schema dictionary
    """
    # All providers now use the same schema since Google uses function calling
    return create_n8n_workflow_schema()