"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { ReactFlowDemo } from "@/components/animations/ReactFlowDemo";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-white/70" />
            <span className="text-white/70 text-sm font-medium">
              Generate Perfect N8N Workflows in Seconds
            </span>
          </motion.div>

          {/* Main Headline */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-4xl lg:text-6xl font-bold leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                Generate N8N
              </span>
              <br />
              <span className="bg-gradient-to-r from-gray-300 via-white to-gray-100 bg-clip-text text-transparent">
                Workflows
              </span>
              <br />
              <span className="text-white">in Seconds</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-lg text-gray-300 leading-relaxed max-w-2xl"
            >
              Transform your ideas into working N8N workflows with AI. See visual previews, 
              fix connections, and export perfect JSON - no more buggy extensions or broken outputs.
            </motion.p>
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 20px 40px rgba(255, 255, 255, 0.1)" 
              }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-6 py-3 bg-gradient-to-r from-white/20 to-white/10 text-white rounded-xl font-semibold text-base shadow-2xl overflow-hidden border border-white/20 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                <Zap className="w-5 h-5" />
                Generate Your First Workflow
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 border border-white/20 text-white rounded-xl font-semibold text-base backdrop-blur-sm hover:bg-white/5 transition-all duration-300"
            >
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex items-center gap-8 pt-8"
          >
            <div className="text-center">
              <div className="text-xl font-bold text-white">5 min</div>
              <div className="text-xs text-gray-400">Average setup time</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">4x</div>
              <div className="text-xs text-gray-400">Faster than manual</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">100%</div>
              <div className="text-xs text-gray-400">Working outputs</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Content - ReactFlow Demo */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="relative"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl blur-xl"></div>
            
            {/* Container */}
            <div className="relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-2xl">
              <ReactFlowDemo />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-white/60 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
