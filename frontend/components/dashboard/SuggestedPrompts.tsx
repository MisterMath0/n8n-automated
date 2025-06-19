"use client";

import { motion } from "framer-motion";

const suggestedPrompts = [
  "Create a lead enrichment workflow",
  "Build an email automation sequence", 
  "Generate a data sync workflow",
  "Create a social media monitoring workflow",
  "Build a customer onboarding automation",
  "Create a invoice processing workflow"
];

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  return (
    <div className="p-4 border-t border-white/10">
      <p className="text-xs text-gray-400 mb-3">✨ Try these examples:</p>
      <div className="space-y-2">
        {suggestedPrompts.map((prompt, index) => (
          <motion.button
            key={prompt}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelectPrompt(prompt)}
            className="w-full text-left p-3 text-xs text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 hover:border-white/20"
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
