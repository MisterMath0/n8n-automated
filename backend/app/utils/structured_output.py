"""
Utilities for structured output and JSON schema validation for AI models.

This module provides schema definitions and validation utilities for ensuring
AI models generate valid JSON that conforms to our Pydantic models.
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
    Create OpenAPI 3.0 schema for N8N workflows compatible with Google GenAI structured output.
    
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
                            "description": "Unique UUID for the node"
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
                            "nullable": True
                        },
                        "credentials": {
                            "type": "object", 
                            "description": "Credential references for the node",
                            "nullable": True
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
                "description": "Node connections defining workflow flow",
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
                "nullable": True
            },
            "versionId": {
                "type": "string",
                "description": "Version UUID for the workflow"
            },
            "id": {
                "type": "string", 
                "description": "Unique UUID for the workflow"
            },
            "tags": {
                "type": "array",
                "description": "Tags for categorizing the workflow",
                "items": {"type": "string"}
            }
        },
        "required": ["name", "nodes", "connections", "active", "versionId", "id", "tags"]
    }


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
    
    # Ensure required fields exist
    if "id" not in workflow_data:
        workflow_data["id"] = str(uuid.uuid4())
    if "versionId" not in workflow_data:
        workflow_data["versionId"] = str(uuid.uuid4())
    if "tags" not in workflow_data:
        workflow_data["tags"] = []
    if "active" not in workflow_data:
        workflow_data["active"] = False
    if "nodes" not in workflow_data:
        workflow_data["nodes"] = []
    if "connections" not in workflow_data:
        workflow_data["connections"] = {}
    if "name" not in workflow_data:
        workflow_data["name"] = "Generated Workflow"
    
    # Ensure all nodes have required fields
    for node in workflow_data.get("nodes", []):
        if "id" not in node:
            node["id"] = str(uuid.uuid4())
        if "position" not in node:
            node["position"] = [0, 0]
        if "parameters" not in node:
            node["parameters"] = {}
        if "credentials" not in node:
            node["credentials"] = {}
    
    return workflow_data


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
        return workflow
    except Exception as e:
        logger.error("Failed to validate workflow data", error=str(e), workflow_keys=list(workflow_data.keys()) if isinstance(workflow_data, dict) else type(workflow_data))
        raise ValueError(f"Failed to create valid workflow: {str(e)}")
