import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ValidationStatusProps {
  status: 'idle' | 'validating' | 'valid' | 'invalid' | 'error';
  message?: string;
}

export function ValidationStatus({ status, message }: ValidationStatusProps) {
  const statusConfig = {
    idle: { icon: null, color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
    validating: { icon: Loader2, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    valid: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-400/10' },
    invalid: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-400/10' },
    error: { icon: AlertCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (status === 'idle' || !Icon) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`absolute top-16 left-4 z-40 ${config.bgColor} ${config.color} border border-current/20 rounded-lg px-3 py-2 flex items-center space-x-2 text-sm`}
    >
      <Icon className={`w-4 h-4 ${status === 'validating' ? 'animate-spin' : ''}`} />
      <span>{message || status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </motion.div>
  );
}
