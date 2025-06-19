import { Node, Edge } from 'reactflow';
import { N8NWorkflow, N8NNode, N8NConnection } from '@/types/api';

interface ReactFlowNode extends Node {
  data: {
    label: string;
    nodeType: string;
    parameters: Record<string, any>;
  };
}

/**
 * Converts an N8N workflow to React Flow format
 * @param n8nWorkflow The N8N workflow to convert
 * @returns Object containing React Flow nodes and edges
 */
export function convertN8NToReactFlow(n8nWorkflow: N8NWorkflow): {
  nodes: ReactFlowNode[];
  edges: Edge[];
} {
  // Create a mapping of node names to IDs for connection conversion
  const nameToIdMap = Object.fromEntries(
    n8nWorkflow.nodes.map(node => [node.name, node.id])
  );

  // Convert N8N nodes to React Flow format
  const reactFlowNodes: ReactFlowNode[] = n8nWorkflow.nodes.map(node => ({
    id: node.id,
    type: 'custom', // Can be extended to map different node types to custom components
    position: { x: node.position[0], y: node.position[1] },
    data: {
      label: node.name,
      nodeType: node.type,
      parameters: node.parameters || {}
    }
  }));

  // Convert N8N connections to React Flow edges
  const reactFlowEdges: Edge[] = [];
  
  // Process each node's connections
  Object.entries(n8nWorkflow.connections || {}).forEach(([sourceName, outputs]) => {
    const sourceId = nameToIdMap[sourceName];
    
    // Handle main output connections
    outputs.main?.[0]?.forEach((connection, index) => {
      const targetId = nameToIdMap[connection.node];
      
      if (sourceId && targetId) {
        reactFlowEdges.push({
          id: `${sourceId}-${targetId}-${index}`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          // Optional: Add styling based on connection type
          style: { stroke: '#fff', strokeWidth: 2 },
          animated: true
        });
      }
    });
  });

  return {
    nodes: reactFlowNodes,
    edges: reactFlowEdges
  };
}

/**
 * Automatically layout nodes in a top-down flow
 * @param nodes React Flow nodes to arrange
 * @returns Nodes with updated positions
 */
export function autoLayoutNodes(nodes: ReactFlowNode[]): ReactFlowNode[] {
  const VERTICAL_SPACING = 100;
  const HORIZONTAL_SPACING = 250;
  const MAX_NODES_PER_ROW = 3;

  return nodes.map((node, index) => {
    const row = Math.floor(index / MAX_NODES_PER_ROW);
    const col = index % MAX_NODES_PER_ROW;

    return {
      ...node,
      position: {
        x: col * HORIZONTAL_SPACING + 50, // 50px initial offset
        y: row * VERTICAL_SPACING + 50    // 50px initial offset
      }
    };
  });
}

/**
 * Centers the workflow view based on node positions
 * @param nodes React Flow nodes
 * @returns Center point {x, y} for the view
 */
export function getWorkflowCenter(nodes: ReactFlowNode[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 0, y: 0 };

  const xs = nodes.map(node => node.position.x);
  const ys = nodes.map(node => node.position.y);

  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2
  };
} 