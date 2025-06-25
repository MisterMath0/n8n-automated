import { XCircle } from 'lucide-react';

interface WorkflowErrorProps {
  error: string;
  onRetry: () => void;
}

export function WorkflowError({ error, onRetry }: WorkflowErrorProps) {
  return (
    <div className="flex-1 h-full bg-black/60 relative flex items-center justify-center">
      <div className="text-center p-6">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-white text-lg font-semibold mb-2">Workflow Load Error</h3>
        <p className="text-gray-400 text-sm mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
