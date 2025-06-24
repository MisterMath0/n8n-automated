import { getNodeIcon, getNodeColor, getNodeCategory, isTriggerNode } from './node-styling';

/**
 * Test utility to verify node styling mappings work correctly
 */
export function testNodeStyling() {
  // Test cases covering different N8N node types
  const testCases = [
    // Triggers
    'n8n-nodes-base.webhook',
    'n8n-nodes-base.manualTrigger',
    'n8n-nodes-base.cronTrigger',
    
    // Core Logic
    'n8n-nodes-base.function',
    'n8n-nodes-base.if',
    'n8n-nodes-base.httpRequest',
    
    // Communication
    'n8n-nodes-base.gmail',
    'n8n-nodes-base.slack',
    'n8n-nodes-base.discord',
    
    // Data
    'n8n-nodes-base.postgres',
    'n8n-nodes-base.googleSheets',
    'n8n-nodes-base.mongodb',
    
    // Social
    'n8n-nodes-base.twitter',
    'n8n-nodes-base.facebook',
    
    // Unknown/Custom nodes
    'custom-node-type',
    'unknown-service',
  ];

  console.group('🎨 Node Styling Test Results');
  
  testCases.forEach(nodeType => {
    const icon = getNodeIcon(nodeType);
    const color = getNodeColor(nodeType);
    const category = getNodeCategory(nodeType);
    const isTrigger = isTriggerNode(nodeType);
  });
  
  console.groupEnd();
  
  // Verify no icons are undefined
  const hasUndefinedIcons = testCases.some(nodeType => !getNodeIcon(nodeType));
  const hasUndefinedColors = testCases.some(nodeType => !getNodeColor(nodeType));
  
  if (hasUndefinedIcons || hasUndefinedColors) {
  } else {
  }

  return {
    testCases,
    results: testCases.map(nodeType => ({
      nodeType,
      icon: getNodeIcon(nodeType),
      color: getNodeColor(nodeType),
      category: getNodeCategory(nodeType),
      isTrigger: isTriggerNode(nodeType),
    })),
  };
}

/**
 * Debug function to help identify what category a specific node type would be mapped to
 */
export function debugNodeMapping(nodeType: string) {
  console.group(`🔍 Debug: ${nodeType}`);
  
  const lowerNodeType = nodeType.toLowerCase();
  
  // Show which patterns it matches
  const patterns = [
    'webhook', 'trigger', 'schedule', 'email', 'slack', 'http', 'function', 
    'database', 'sheets', 'postgres', 'mysql', 'mongodb', 'gmail', 'discord'
  ];
  
  const matches = patterns.filter(pattern => lowerNodeType.includes(pattern));
  
  // Extract service name if N8N format
  const serviceMatch = lowerNodeType.match(/n8n-nodes-base\.(.+)/);
  if (serviceMatch) {
  }
  
  console.groupEnd();
}

// Export for use in development/debugging
if (typeof window !== 'undefined') {
  (window as any).testNodeStyling = testNodeStyling;
  (window as any).debugNodeMapping = debugNodeMapping;
}
