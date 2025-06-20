"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { 
  Download, 
  Play, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy
} from "lucide-react";
import { Workflow } from "@/hooks/useWorkflows";
import { useToast } from '@/components/providers';

interface WorkflowActionsProps {
  workflow: Workflow;
  onTest: () => void;
  onExport: () => void;
  isValidatingWorkflow: boolean;
  isExporting?: boolean;
  validationStatus?: 'idle' | 'validating' | 'valid' | 'invalid' | 'error';
}

export function WorkflowActions({ 
  workflow, 
  onTest, 
  onExport, 
  isValidatingWorkflow,
  isExporting = false,
  validationStatus = 'idle'
}: WorkflowActionsProps) {
  const [isCopying, setIsCopying] = useState(false);
  const toast = useToast();

  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'validating':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const getTestButtonText = () => {
    switch (validationStatus) {
      case 'validating':
        return 'Testing...';
      case 'valid':
        return 'Valid';
      case 'invalid':
        return 'Invalid';
      case 'error':
        return 'Error';
      default:
        return 'Validate workflow';
    }
  };

  const getTestButtonColor = () => {
    switch (validationStatus) {
      case 'valid':
        return 'from-green-500 to-green-600 shadow-green-500/25';
      case 'invalid':
        return 'from-red-500 to-red-600 shadow-red-500/25';
      case 'error':
        return 'from-yellow-500 to-yellow-600 shadow-yellow-500/25';
      default:
        return 'from-green-500 to-green-600 shadow-green-500/25';
    }
  };

  const handleCopyToClipboard = async () => {
    if (!workflow?.workflow) {
      toast.error('No workflow to copy');
      return;
    }

    setIsCopying(true);
    try {
      const workflowJson = JSON.stringify(workflow.workflow, null, 2);
      await navigator.clipboard.writeText(workflowJson);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Copy failed');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/90 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
        {/* Production-ready Test/Validate Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onTest}
          disabled={isValidatingWorkflow}
          className={`px-4 py-2 bg-gradient-to-r ${getTestButtonColor()} text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50`}
        >
          {getValidationIcon()}
          {getTestButtonText()}
        </motion.button>
        
        {/* Production-ready Export Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExport}
          disabled={isExporting}
          className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-white/20 transition-all border border-white/20 disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExporting ? 'Exporting...' : 'Export JSON'}
        </motion.button>

        {/* Production-ready Copy Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyToClipboard}
          disabled={isCopying}
          className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-white/20 transition-all border border-white/20 disabled:opacity-50"
        >
          {isCopying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {isCopying ? 'Copying...' : 'Copy'}
        </motion.button>
      </div>
    </>
  );
}
