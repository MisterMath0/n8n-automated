import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="bg-black/80 border border-white/20 rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
            <span className="text-white text-sm font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
