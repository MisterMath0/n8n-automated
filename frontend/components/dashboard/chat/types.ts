export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    type?: 'text' | 'workflow' | 'error';
    workflowData?: any;
    isStreaming?: boolean;
    thinking?: string;
    progress?: string;
    tools?: string[];
}