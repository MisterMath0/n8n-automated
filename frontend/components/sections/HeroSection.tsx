"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { EmailCollector } from "../ui/EmailCollector";
import { useState } from "react";

const DynamicReactFlowDemo = dynamic(() => import("@/components/animations/ReactFlowDemo").then(mod => mod.ReactFlowDemo), { ssr: false });

export function HeroSection() {
  const [showEmailCollector, setShowEmailCollector] = useState(false);

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-400/30 bg-red-500/10 backdrop-blur-sm"
          >
            <DollarSign className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-medium">
              LIMITED BETA ACCESS
            </span>
          </motion.div>

          {/* Main Headline - Emotional Hook */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-3xl lg:text-4xl font-bold leading-tight"
            >
              <span className="text-red-400">
                Stop Losing
              </span>
              <br />
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                $2,000+ Per Week
              </span>
              <br />
              <span className="text-white">On Manual Work</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-base text-gray-300 leading-relaxed max-w-2xl"
            >
              Turn 4-hour automation projects into <span className="text-white font-semibold">30-second wins</span>. 
              Get perfect n8n workflows that work the first time, every time.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-sm text-gray-400 leading-relaxed max-w-2xl"
            >
              While your competitors waste days on manual setup, smart automation professionals 
              are using AI to deliver projects <span className="text-white">10x faster</span> and pocket the difference.
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
              onClick={() => setShowEmailCollector(true)}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-base shadow-2xl overflow-hidden border border-green-400/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5" />
                Get Access
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 border border-white/20 text-white rounded-xl font-semibold text-base backdrop-blur-sm hover:bg-white/5 transition-all duration-300"
            >
              See 30-Second Demo
            </motion.button>
          </motion.div>

          {/* Social Proof Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex items-center gap-8 pt-8"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-xl font-bold text-white">480x</div>
                <div className="text-xs text-gray-400">Faster delivery</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-xl font-bold text-white">$400+</div>
                <div className="text-xs text-gray-400">Saved per workflow</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-xl font-bold text-white">100%</div>
                <div className="text-xs text-gray-400">Working outputs</div>
              </div>
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
              <DynamicReactFlowDemo />
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

      <EmailCollector
        isOpen={showEmailCollector}
        onClose={() => setShowEmailCollector(false)}
      />
    </section>
  );
}
