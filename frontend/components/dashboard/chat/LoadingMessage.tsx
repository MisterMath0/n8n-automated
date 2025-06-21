"use client";

import { motion } from "framer-motion";
import { Bot, Loader2 } from "lucide-react";

export function LoadingMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Generating workflow...</span>
        </div>
      </div>
    </motion.div>
  );
}