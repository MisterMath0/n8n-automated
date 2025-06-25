import { useState, useCallback } from 'react';
import { useToast } from '@/components/providers';
import { validateWorkflow } from '@/lib/utils/workflowConverter';

export function useWorkflowValidation() {
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const toast = useToast();

  const validateWorkflowNodes = useCallback(async (nodes: any[]) => {
    if (nodes.length === 0) {
      toast.error('No workflow to test');
      return;
    }
    
    setIsValidating(true);
    setValidationStatus('validating');
    setValidationMessage('Testing workflow...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const validationResult = validateWorkflow(nodes);
      
      if (!validationResult.isValid) {
        setValidationStatus('invalid');
        setValidationMessage(validationResult.errors[0] || 'Workflow validation failed');
        toast.error('Workflow validation failed');
        return;
      }
      
      if (validationResult.warnings.length > 0) {
        console.warn('Workflow warnings:', validationResult.warnings);
      }
      
      setValidationStatus('valid');
      setValidationMessage('Workflow is valid and ready to run');
      toast.success('Workflow validation passed');
      
      setTimeout(() => {
        setValidationStatus('idle');
        setValidationMessage('');
      }, 3000);
      
    } catch (error) {
      setValidationStatus('error');
      setValidationMessage('Failed to test workflow');
      toast.error('Workflow testing failed');
    } finally {
      setIsValidating(false);
    }
  }, [toast]);

  return {
    validationStatus,
    validationMessage,
    isValidating,
    validateWorkflowNodes,
  };
}
