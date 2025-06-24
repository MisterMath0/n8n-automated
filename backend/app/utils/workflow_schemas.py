"""
Backward compatibility wrapper for workflow schemas.
The schemas have been moved to services.workflow.schemas for better organization.
"""

# Import from new location
from ..services.workflow.schemas import (
    create_workflow_plan_schema,
    create_workflow_nodes_schema,
    create_workflow_connections_schema
)

# Re-export for backward compatibility
__all__ = [
    "create_workflow_plan_schema",
    "create_workflow_nodes_schema", 
    "create_workflow_connections_schema"
]
