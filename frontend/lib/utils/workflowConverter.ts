import { Node, Edge } from 'reactflow';
import { N8NWorkflow, N8NNode } from '@/types/api';
import { isTriggerNode } from './node-styling';

// This data structure must match what the custom N8nNode.tsx component expects in its `data` prop.
export interface N8nNodeData {
  label: string;
  nodeType: string;
  subtitle?: string;
  parameters: Record<string, any>;
}

/**
 * Generates intelligent subtitles for N8N nodes based on their type and parameters
 */
function generateSubtitle(node: N8NNode): string | undefined {
  const params = node.parameters || {};
  const nodeType = node.type.toLowerCase();
  
  try {
    // Trigger nodes
    if (isTriggerNode(node.type)) {
      if (nodeType.includes('webhook')) {
        return 'Receives HTTP requests';
      }
      if (nodeType.includes('schedule') || nodeType.includes('cron')) {
        return 'Runs on schedule';
      }
      if (nodeType.includes('manual')) {
        return 'Manual execution';
      }
      return 'Triggers workflow';
    }

    // HTTP Request nodes
    if (nodeType.includes('httprequest')) {
      const method = (params.method || 'GET').toString().toUpperCase();
      const url = params.url?.toString() || '';
      if (url) {
        const displayUrl = url.length > 20 ? `${url.substring(0, 20)}...` : url;
        return `${method} ${displayUrl}`;
      }
      return `${method} request`;
    }

    // Logic nodes
    if (nodeType.includes('if')) {
      const conditions = params.conditions?.values?.length || 1;
      return `${conditions} condition${conditions !== 1 ? 's' : ''}`;
    }

    if (nodeType.includes('switch')) {
      const rules = params.rules?.rules?.length || 1;
      return `${rules} route${rules !== 1 ? 's' : ''}`;
    }

    if (nodeType.includes('filter')) {
      return 'Filters data items';
    }

    if (nodeType.includes('set')) {
      const mode = params.mode === 'simple' ? 'Simple' : 'Advanced';
      const fieldsCount = params.values?.values?.length || params.fields?.length || 1;
      return `${mode} mode (${fieldsCount} field${fieldsCount !== 1 ? 's' : ''})`;
    }

    if (nodeType.includes('merge')) {
      const mode = params.mode || 'append';
      return `Merge mode: ${mode}`;
    }

    // Function/Code nodes
    if (nodeType.includes('function') || nodeType.includes('code')) {
      const codeLength = params.jsCode?.length || params.code?.length || 0;
      if (codeLength > 0) {
        return `${codeLength} characters of code`;
      }
      return 'Custom JavaScript';
    }

    // Email nodes
    if (nodeType.includes('email') || nodeType.includes('gmail')) {
      const operation = params.operation || params.resource;
      if (operation === 'send') {
        const to = params.toEmail || params.to;
        return to ? `Send to ${to}` : 'Send email';
      }
      if (operation === 'get' || operation === 'getAll') {
        return 'Read emails';
      }
      return 'Email operation';
    }

    // Slack nodes
    if (nodeType.includes('slack')) {
      const operation = params.operation;
      const channel = params.channel;
      if (operation === 'postMessage') {
        return channel ? `Message to ${channel}` : 'Send message';
      }
      return 'Slack operation';
    }

    // Database nodes
    if (nodeType.includes('postgres') || nodeType.includes('mysql') || 
        nodeType.includes('mongodb') || nodeType.includes('database')) {
      const operation = params.operation;
      if (operation === 'select' || operation === 'find') {
        return 'Query data';
      }
      if (operation === 'insert') {
        return 'Insert data';
      }
      if (operation === 'update') {
        return 'Update data';
      }
      if (operation === 'delete') {
        return 'Delete data';
      }
      return 'Database operation';
    }

    // Google Sheets
    if (nodeType.includes('googlesheets') || nodeType.includes('sheets')) {
      const operation = params.operation;
      if (operation === 'append') {
        return 'Add rows';
      }
      if (operation === 'read') {
        return 'Read rows';
      }
      if (operation === 'update') {
        return 'Update rows';
      }
      return 'Spreadsheet operation';
    }

    // File operations
    if (nodeType.includes('googledrive') || nodeType.includes('dropbox') || 
        nodeType.includes('s3') || nodeType.includes('file')) {
      const operation = params.operation;
      if (operation === 'upload') {
        return 'Upload file';
      }
      if (operation === 'download') {
        return 'Download file';
      }
      if (operation === 'list') {
        return 'List files';
      }
      return 'File operation';
    }

    // API/Service specific nodes
    if (nodeType.includes('anthropic') || nodeType.includes('openai')) {
      return 'AI completion';
    }

    if (nodeType.includes('stripe')) {
      const operation = params.operation;
      return operation ? `Stripe ${operation}` : 'Payment processing';
    }

    // Generic operation-based subtitle
    if (params.operation) {
      const operation = params.operation.toString();
      return operation.charAt(0).toUpperCase() + operation.slice(1);
    }

    // Generic resource-based subtitle
    if (params.resource) {
      const resource = params.resource.toString();
      return resource.charAt(0).toUpperCase() + resource.slice(1);
    }

    // Default based on node type
    const nodeTypeParts = node.type.split('.');
    const serviceName = nodeTypeParts[nodeTypeParts.length - 1];
    return serviceName.charAt(0).toUpperCase() + serviceName.slice(1);

  } catch (error) {
    console.error('Error generating subtitle for node:', node, error);
    return 'Node operation';
  }
}

/**
 * Converts an N8N workflow to React Flow format with enhanced node data.
 * @param n8nWorkflow The N8N workflow to convert.
 * @returns Object containing React Flow nodes and edges.
 */
export function convertN8NToReactFlow(n8nWorkflow: N8NWorkflow): {
  nodes: Node<N8nNodeData>[];
  edges: Edge[];
} {
  // Create mapping from node names to IDs for connection resolution
  const nameToIdMap = Object.fromEntries(
    n8nWorkflow.nodes.map(node => [node.name, node.id])
  );

  // Convert N8N nodes to React Flow nodes
  const reactFlowNodes: Node<N8nNodeData>[] = n8nWorkflow.nodes.map(node => ({
    id: node.id,
    type: 'n8nNode', // This must match the key in nodeTypes in WorkflowCanvas
    position: { 
      x: node.position[0] || 0, 
      y: node.position[1] || 0 
    },
    data: {
      label: node.name,
      nodeType: node.type,
      parameters: node.parameters || {},
      subtitle: generateSubtitle(node),
    },
    // Enhanced styling for better visual hierarchy
    style: {
      zIndex: isTriggerNode(node.type) ? 10 : 1,
    },
    // Make trigger nodes non-connectable as targets
    connectable: true,
    deletable: true,
    selectable: true,
  }));

  // Convert N8N connections to React Flow edges with enhanced styling for left/right flow
  const reactFlowEdges: Edge[] = [];
  
  Object.entries(n8nWorkflow.connections || {}).forEach(([sourceName, outputs]) => {
    const sourceId = nameToIdMap[sourceName];
    if (!sourceId) return;

    Object.values(outputs).forEach(output => {
      output[0]?.forEach((connection: any, index: number) => {
        const targetId = nameToIdMap[connection.node];
        if (sourceId && targetId) {
          reactFlowEdges.push({
            id: `${sourceId}-${targetId}-${index}`,
            source: sourceId,
            target: targetId,
            sourceHandle: null, // Use default source handle (right side)
            targetHandle: null, // Use default target handle (left side)
            type: 'smoothstep', // Better for left-right connections
            animated: true,
            style: { 
              stroke: '#ffffff80', 
              strokeWidth: 2,
              filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))',
            },
            // Enhanced edge styling for better visibility
            markerEnd: {
              type: 'arrow',
              color: '#ffffff80',
              width: 16,
              height: 16,
            },
          });
        }
      });
    });
  });

  return {
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
  };
}

/**
 * Advanced auto-layout algorithm optimized for left-right flow like N8N
 * @param nodes React Flow nodes to arrange
 * @returns Nodes with updated positions
 */
export function autoLayoutNodes(nodes: Node<N8nNodeData>[]): Node<N8nNodeData>[] {
  if (nodes.length === 0) return nodes;

  // Layout constants - much more spacing for better visibility
  const HORIZONTAL_SPACING = 600; // Increased significantly
  const VERTICAL_SPACING = 500; // Increased significantly  
  const TRIGGER_COLUMN_X = 100; // Fixed X position for all triggers
  const START_Y = 100;
  const REGULAR_START_X = 600; // Where non-trigger nodes start

  // Separate trigger nodes and regular nodes
  const triggerNodes = nodes.filter(node => isTriggerNode(node.data.nodeType));
  const regularNodes = nodes.filter(node => !isTriggerNode(node.data.nodeType));

  let positionedNodes: Node<N8nNodeData>[] = [];

  // 1. Position all trigger nodes in the same vertical column on the left
  triggerNodes.forEach((node, index) => {
    positionedNodes.push({
      ...node,
      position: {
        x: TRIGGER_COLUMN_X,
        y: START_Y + (index * VERTICAL_SPACING),
      },
    });
  });

  // 2. Analyze connections to create a better flow layout for regular nodes
  const connections = nodes.flatMap(node => 
    node.data?.parameters?.connections || []
  );

  // 3. For now, arrange regular nodes in a simple grid starting from the right of triggers
  // This could be enhanced later with a more sophisticated algorithm
  const maxNodesPerColumn = Math.ceil(Math.sqrt(regularNodes.length));
  
  regularNodes.forEach((node, index) => {
    const column = Math.floor(index / maxNodesPerColumn);
    const row = index % maxNodesPerColumn;

    positionedNodes.push({
      ...node,
      position: {
        x: REGULAR_START_X + (column * HORIZONTAL_SPACING),
        y: START_Y + (row * VERTICAL_SPACING),
      },
    });
  });

  return positionedNodes;
}

/**
 * Advanced layout algorithm that considers the actual workflow connections
 * @param nodes React Flow nodes to arrange
 * @param edges React Flow edges representing connections
 * @returns Nodes with updated positions based on connection flow
 */
export function autoLayoutNodesWithConnections(
  nodes: Node<N8nNodeData>[], 
  edges: Edge[]
): Node<N8nNodeData>[] {
  if (nodes.length === 0) return nodes;

  // Layout constants
  const HORIZONTAL_SPACING = 600;
  const VERTICAL_SPACING = 300;
  const TRIGGER_COLUMN_X = 100;
  const START_Y = 100;

  // Separate trigger and regular nodes
  const triggerNodes = nodes.filter(node => isTriggerNode(node.data.nodeType));
  const regularNodes = nodes.filter(node => !isTriggerNode(node.data.nodeType));

  let positionedNodes: Node<N8nNodeData>[] = [];

  // Position trigger nodes in left column
  triggerNodes.forEach((node, index) => {
    positionedNodes.push({
      ...node,
      position: {
        x: TRIGGER_COLUMN_X,
        y: START_Y + (index * VERTICAL_SPACING),
      },
    });
  });

  // Build adjacency graph from edges
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  // Initialize
  regularNodes.forEach(node => {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  // Build graph
  edges.forEach(edge => {
    const source = edge.source;
    const target = edge.target;
    
    if (adjacency.has(source)) {
      adjacency.get(source)!.push(target);
    }
    if (inDegree.has(target)) {
      inDegree.set(target, (inDegree.get(target) || 0) + 1);
    }
  });

  // Topological sort to determine column order
  const columns: string[][] = [];
  const visited = new Set<string>();
  
  // Start with nodes that have no incoming edges (or are connected to triggers)
  const startNodes = regularNodes.filter(node => 
    (inDegree.get(node.id) || 0) === 0 || 
    edges.some(edge => edge.target === node.id && triggerNodes.some(t => t.id === edge.source))
  );

  let currentColumn = 0;
  let queue = [...startNodes.map(n => n.id)];

  while (queue.length > 0) {
    if (!columns[currentColumn]) columns[currentColumn] = [];
    
    const nextQueue: string[] = [];
    
    queue.forEach(nodeId => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        columns[currentColumn].push(nodeId);
        
        // Add connected nodes to next column
        const connections = adjacency.get(nodeId) || [];
        connections.forEach(connectedId => {
          if (!visited.has(connectedId)) {
            nextQueue.push(connectedId);
          }
        });
      }
    });
    
    queue = [...new Set(nextQueue)]; // Remove duplicates
    currentColumn++;
    
    // Prevent infinite loops
    if (currentColumn > regularNodes.length) break;
  }

  // Add any remaining unvisited nodes to the last column
  const unvisited = regularNodes.filter(node => !visited.has(node.id));
  if (unvisited.length > 0) {
    if (!columns[currentColumn]) columns[currentColumn] = [];
    columns[currentColumn].push(...unvisited.map(n => n.id));
  }

  // Position nodes based on columns
  columns.forEach((column, colIndex) => {
    column.forEach((nodeId, rowIndex) => {
      const node = regularNodes.find(n => n.id === nodeId);
      if (node) {
        positionedNodes.push({
          ...node,
          position: {
            x: TRIGGER_COLUMN_X + HORIZONTAL_SPACING + (colIndex * HORIZONTAL_SPACING),
            y: START_Y + (rowIndex * VERTICAL_SPACING),
          },
        });
      }
    });
  });

  return positionedNodes;
}

/**
 * Centers the workflow view based on node positions with better calculation
 * @param nodes React Flow nodes
 * @returns Center point {x, y} for the view
 */
export function getWorkflowCenter(nodes: Node<N8nNodeData>[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 0, y: 0 };

  const positions = nodes.map(node => node.position);
  const xs = positions.map(pos => pos.x);
  const ys = positions.map(pos => pos.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX + (maxX - minX) / 2,
    y: minY + (maxY - minY) / 2,
  };
}

/**
 * Get the bounding box of all nodes for proper canvas sizing
 * @param nodes React Flow nodes
 * @returns Bounding box with padding
 */
export function getWorkflowBounds(nodes: Node<N8nNodeData>[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  const positions = nodes.map(node => node.position);
  const xs = positions.map(pos => pos.x);
  const ys = positions.map(pos => pos.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Add padding and account for node width/height
  const padding = 200;
  const nodeWidth = 200; // Approximate node width
  const nodeHeight = 120; // Approximate node height

  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + nodeWidth + (padding * 2),
    height: (maxY - minY) + nodeHeight + (padding * 2),
  };
}

/**
 * Validates if a workflow has the minimum required structure
 * @param nodes React Flow nodes
 * @returns Validation result with details
 */
export function validateWorkflow(nodes: Node<N8nNodeData>[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for at least one node
  if (nodes.length === 0) {
    errors.push('Workflow must contain at least one node');
    return { isValid: false, errors, warnings };
  }

  // Check for trigger node
  const triggerNodes = nodes.filter(node => isTriggerNode(node.data.nodeType));
  if (triggerNodes.length === 0) {
    warnings.push('Workflow should have at least one trigger node');
  }

  // Check for disconnected nodes (this would need edge data)
  if (nodes.length > 1) {
    warnings.push('Verify all nodes are properly connected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
