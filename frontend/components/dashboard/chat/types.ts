export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    type?: 'text' | 'workflow' | 'error';
    workflowData?: any;
  }
  
  export interface SimpleChatProps {
    onClose: () => void;
    onWorkflowGenerated?: (workflow: any) => void;
  }