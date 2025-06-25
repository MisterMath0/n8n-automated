"use client";

import { motion } from "framer-motion";
import { Bot, Loader2, Sparkles, Cpu, Code, Workflow } from "lucide-react";
import { useState, useEffect } from "react";

interface LoadingMessageProps {
  isGenerating?: boolean;
  progress?: string;
  className?: string;
}

const loadingSteps = [
  { icon: Bot, text: "AI is thinking...", color: "text-blue-400" },
  { icon: Cpu, text: "Processing your request...", color: "text-green-400" },
  { icon: Code, text: "Generating workflow logic...", color: "text-purple-400" },
  { icon: Workflow, text: "Building automation...", color: "text-orange-400" },
  { icon: Sparkles, text: "Adding the finishing touches...", color: "text-pink-400" },
];

export function LoadingMessage({ 
  isGenerating = true, 
  progress,
  className = "" 
}: LoadingMessageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState("");

  // Cycle through loading steps
  useEffect(() => {
    if (!isGenerating) return;
    
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % loadingSteps.length);
    }, 2000);

    return () => clearInterval(stepInterval);
  }, [isGenerating]);

  // Animate dots
  useEffect(() => {
    if (!isGenerating) return;
    
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(dotsInterval);
  }, [isGenerating]);

  if (!isGenerating) return null;

  const currentStepData = loadingSteps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex gap-3 ${className}`}
    >
      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>
      
      <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
        {/* Main loading indicator */}
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-green-400" />
          <div className="flex-1">
            <div className="text-white text-sm font-medium">
              Assistant is working{dots}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {progress || "This may take a few moments"}
            </div>
          </div>
        </div>

        {/* Animated step indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`${currentStepData.color}`}
          >
            <StepIcon className="w-4 h-4" />
          </motion.div>
          <motion.span
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-xs ${currentStepData.color}`}
          >
            {currentStepData.text}
          </motion.span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 8, 
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        </div>

        {/* Loading dots */}
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </div>

        {/* Helpful tip */}
        <div className="text-xs text-gray-500 text-center border-t border-white/5 pt-2">
          💡 Tip: The more detailed your description, the better the workflow
        </div>
      </div>
    </motion.div>
  );
}

// Enhanced version with different loading states
export function LoadingMessageWithStates({ 
  state = "thinking",
  progress,
  className = ""
}: {
  state?: "thinking" | "processing" | "building" | "finalizing";
  progress?: string;
  className?: string;
}) {
  const stateConfig = {
    thinking: {
      icon: Bot,
      color: "text-blue-400",
      bgColor: "from-blue-500/20 to-purple-500/20",
      title: "AI is thinking...",
      description: "Analyzing your request and planning the workflow"
    },
    processing: {
      icon: Cpu,
      color: "text-green-400", 
      bgColor: "from-green-500/20 to-blue-500/20",
      title: "Processing logic...",
      description: "Building the automation structure"
    },
    building: {
      icon: Workflow,
      color: "text-orange-400",
      bgColor: "from-orange-500/20 to-red-500/20", 
      title: "Creating workflow...",
      description: "Connecting nodes and defining triggers"
    },
    finalizing: {
      icon: Sparkles,
      color: "text-pink-400",
      bgColor: "from-pink-500/20 to-purple-500/20",
      title: "Almost done...",
      description: "Adding final touches and optimizations"
    }
  };

  const config = stateConfig[state];
  const StateIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex gap-3 ${className}`}
    >
      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>
      
      <div className={`flex-1 bg-gradient-to-r ${config.bgColor} border border-white/10 rounded-lg p-4`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Loader2 className="w-5 h-5 animate-spin text-white/60" />
            <StateIcon className={`w-3 h-3 absolute top-1 left-1 ${config.color}`} />
          </div>
          <div className="flex-1">
            <div className="text-white text-sm font-medium">
              {config.title}
            </div>
            <div className="text-gray-300 text-xs">
              {progress || config.description}
            </div>
          </div>
        </div>

        {/* Animated progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span>Working...</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-1 overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r from-current ${config.color}`}
              initial={{ width: "0%" }}
              animate={{ width: ["0%", "60%", "90%", "60%"] }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
