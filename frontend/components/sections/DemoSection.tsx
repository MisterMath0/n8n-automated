"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Play, X, CheckCircle, AlertTriangle } from "lucide-react";

const competitors = [
  {
    name: "n8nChat",
    rating: "3.2⭐",
    users: "10,000+",
    issues: [
      "Doesn't work - waste of time",
      "UI not displaying at all",
      "API errors not showing", 
      "Chrome-only limitations"
    ],
    color: "from-red-500 to-pink-500"
  },
  {
    name: "Other Tools",
    rating: "Mixed",
    users: "Various",
    issues: [
      "JSON-only outputs",
      "No visual preview",
      "Buggy connections",
      "Complex setup required"
    ],
    color: "from-orange-500 to-red-500"
  }
];

const ourFeatures = [
  "Visual workflow preview with ReactFlow",
  "Smart node validation & auto-fixing", 
  "No API key setup required",
  "Cross-platform web application",
  "Perfect JSON exports that actually work",
  "Real-time error handling & feedback"
];

export function DemoSection() {
  const [activeTab, setActiveTab] = useState("problem");

  return (
    <section id="demo" className="py-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 backdrop-blur-sm mb-6"
          >
            <Play className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-sm font-medium">
              See The Difference
            </span>
          </motion.div>

          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Why 10,000+ Users
            </span>
            <br />
            <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
              Are Frustrated
            </span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Current AI workflow generators are broken. Here's the proof and our solution.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("problem")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === "problem"
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                The Problem
              </button>
              <button
                onClick={() => setActiveTab("solution")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === "solution"
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Our Solution
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="relative">
          {activeTab === "problem" && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-8"
            >
              {competitors.map((competitor, index) => (
                <motion.div
                  key={competitor.name}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="group relative"
                >
                  {/* Glow effect */}
                  <div className={`absolute -inset-1 bg-gradient-to-r ${competitor.color} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500`}></div>
                  
                  {/* Card */}
                  <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white">{competitor.name}</h3>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-red-400">{competitor.rating}</div>
                        <div className="text-sm text-gray-400">{competitor.users} users</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-red-300 flex items-center gap-2">
                        <X className="w-5 h-5" />
                        User Complaints:
                      </h4>
                      {competitor.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-3 text-gray-300">
                          <X className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                          <span>"{issue}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "solution" && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-3xl blur-xl"></div>
                
                {/* Card */}
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-12">
                  <div className="text-center mb-12">
                    <h3 className="text-3xl font-bold text-white mb-4">N8N.AI</h3>
                    <div className="text-2xl font-semibold text-green-400">The Solution That Works</div>
                    <div className="text-gray-400 mt-2">Built for frustrated n8nChat users</div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {ourFeatures.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                        <span className="text-gray-300 text-lg">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 text-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      className="px-10 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl font-semibold text-lg shadow-2xl"
                    >
                      Try It Now - It Actually Works!
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Stats Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
          className="mt-20 grid md:grid-cols-3 gap-8 text-center"
        >
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <div className="text-3xl font-bold text-red-400 mb-2">3.2⭐</div>
            <div className="text-gray-300">n8nChat Rating</div>
            <div className="text-sm text-gray-500 mt-1">10,000+ frustrated users</div>
          </div>
          
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <div className="text-3xl font-bold text-yellow-400 mb-2">70%</div>
            <div className="text-gray-300">Broken Outputs</div>
            <div className="text-sm text-gray-500 mt-1">Current tools fail rate</div>
          </div>
          
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <div className="text-3xl font-bold text-green-400 mb-2">✓ Works</div>
            <div className="text-gray-300">N8N.AI</div>
            <div className="text-sm text-gray-500 mt-1">Visual preview + validation</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
