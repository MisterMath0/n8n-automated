"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Play, CheckCircle, Clock, Zap, Eye, Code, ArrowRight, Sparkles } from "lucide-react";
import Link from 'next/link';

const processes = [
  {
    id: "manual",
    title: "Manual Building",
    subtitle: "The old way",
    time: "2-4 hours",
    color: "from-gray-500 to-gray-400",
    bgColor: "from-gray-500/10 to-gray-400/10",
    borderColor: "border-gray-500/20",
    steps: [
      { text: "Research N8N documentation", time: "30-45 min" },
      { text: "Design workflow architecture", time: "45-60 min" },
      { text: "Configure nodes manually", time: "60-90 min" },
      { text: "Test & debug connections", time: "30-45 min" },
      { text: "Fix parameter errors", time: "15-30 min" },
      { text: "Deploy and monitor", time: "10-15 min" }
    ]
  },
  {
    id: "ai",
    title: "N8N.AI Generation",
    subtitle: "The smart way",
    time: "30 seconds",
    color: "from-white/30 to-white/10",
    bgColor: "from-white/10 to-white/5",
    borderColor: "border-white/30",
    steps: [
      { text: "Describe in plain English", time: "10 sec" },
      { text: "AI generates structure", time: "5 sec" },
      { text: "Visual preview loads", time: "3 sec" },
      { text: "Auto-validation runs", time: "2 sec" },
      { text: "Perfect JSON ready", time: "Instant" },
      { text: "Import to N8N", time: "10 sec" }
    ]
  }
];

const benefits = [
  {
    icon: Eye,
    title: "Visual Preview",
    description: "See your workflow before exporting with interactive ReactFlow visualization",
    highlight: "No blind imports"
  },
  {
    icon: Zap,
    title: "Instant Generation", 
    description: "Transform plain English descriptions into working N8N workflows in seconds",
    highlight: "480x faster"
  },
  {
    icon: CheckCircle,
    title: "Smart Validation",
    description: "Automatically validates nodes and fixes common connection issues",
    highlight: "100% accuracy"
  },
  {
    icon: Code,
    title: "Perfect Exports",
    description: "Generate clean, importable JSON that works first time, every time",
    highlight: "Zero errors"
  }
];

export function DemoSection() {
  const [activeTab, setActiveTab] = useState("comparison");
  const [selectedProcess, setSelectedProcess] = useState("ai");

  return (
    <section id="demo" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-dark mb-6"
          >
            <Play className="w-5 h-5 text-white/70" />
            <span className="text-white/70 font-medium">
              Live Demo
            </span>
          </motion.div>

          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              See It In
            </span>
            <br />
            <span className="bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent">
              Action
            </span>
          </h2>

          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Watch how N8N.AI transforms simple descriptions into working workflows with visual previews.
          </p>
        </motion.div>

        {/* Enhanced Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mb-12"
        >
          <div className="glass-dark rounded-2xl p-3">
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab("comparison")}
                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden ${
                  activeTab === "comparison"
                    ? "bg-gradient-to-r from-white/20 to-white/10 text-white border border-white/30"
                    : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {activeTab === "comparison" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Speed Comparison
                </span>
              </button>
              <button
                onClick={() => setActiveTab("benefits")}
                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden ${
                  activeTab === "benefits"
                    ? "bg-gradient-to-r from-white/20 to-white/10 text-white border border-white/30"
                    : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {activeTab === "benefits" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Key Benefits
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "comparison" && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Process Selector */}
              <div className="flex justify-center mb-8">
                <div className="glass-card rounded-2xl p-2 flex gap-2">
                  {processes.map((process) => (
                    <button
                      key={process.id}
                      onClick={() => setSelectedProcess(process.id)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        selectedProcess === process.id
                          ? `bg-gradient-to-r ${process.bgColor} text-white border ${process.borderColor}`
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      {process.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Process Display */}
              <motion.div
                key={selectedProcess}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="max-w-4xl mx-auto"
              >
                {processes.map((process) => (
                  selectedProcess === process.id && (
                    <div key={process.id} className="relative group">
                      {/* Glow effect */}
                      <div className={`absolute -inset-4 bg-gradient-to-r ${process.color} rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500`}></div>
                      
                      {/* Main card */}
                      <div className={`relative glass-dark rounded-3xl p-8 border ${process.borderColor}`}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-3xl font-bold text-white mb-2">{process.title}</h3>
                            <p className="text-gray-400 text-lg">{process.subtitle}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold bg-gradient-to-r ${process.color} bg-clip-text text-transparent flex items-center gap-2 justify-end`}>
                              <Clock className="w-6 h-6" />
                              {process.time}
                            </div>
                          </div>
                        </div>

                        {/* Steps */}
                        <div className="grid md:grid-cols-2 gap-6">
                          {process.steps.map((step, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5"
                            >
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${process.color} flex items-center justify-center flex-shrink-0`}>
                                {process.id === "ai" ? (
                                  <CheckCircle className="w-5 h-5 text-white" />
                                ) : (
                                  <span className="text-white text-sm font-bold">{i + 1}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-white font-medium mb-1">{step.text}</div>
                                <div className="text-gray-400 text-sm">{step.time}</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Call to action */}
                        {process.id === "ai" && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="mt-8 text-center"
                          >
                            <Link href="/signup">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-gradient-to-r from-white/20 to-white/10 text-white rounded-xl font-semibold text-lg shadow-lg flex items-center gap-3 mx-auto border border-white/20 backdrop-blur-sm"
                              >
                                Try N8N.AI Now
                                <ArrowRight className="w-5 h-5" />
                              </motion.button>
                            </Link>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </motion.div>
            </motion.div>
          )}

          {activeTab === "benefits" && (
            <motion.div
              key="benefits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative"
                >
                  {/* Glow effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  
                  {/* Card */}
                  <div className="relative glass-card rounded-2xl p-8 h-full border border-white/10 group-hover:border-white/20 transition-all duration-300">
                    <div className="flex items-start gap-6">
                      {/* Icon */}
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-r from-white/30 to-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                          <benefit.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -inset-2 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition duration-300"></div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-white">{benefit.title}</h3>
                          <span className="px-3 py-1 bg-white/10 text-white/70 text-xs font-medium rounded-full border border-white/20">
                            {benefit.highlight}
                          </span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced ROI Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-20"
        >
          <div className="relative">
            {/* Background glow */}
            <div className="absolute -inset-8 bg-gradient-to-r from-white/5 via-white/3 to-white/5 rounded-3xl blur-2xl"></div>
            
            {/* Stats container */}
            <div className="relative glass-dark rounded-3xl p-8 border border-white/10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">The Numbers Don't Lie</h3>
                <p className="text-gray-300">Real impact, measurable results</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { value: "480x", label: "Faster Generation", sublabel: "30 seconds vs 4 hours", color: "text-white" },
                  { value: "€400+", label: "Saved Per Workflow", sublabel: "Based on €100/hr rate", color: "text-gray-300" },
                  { value: "100%", label: "Success Rate", sublabel: "Working exports every time", color: "text-gray-100" }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    className="text-center p-6 rounded-2xl bg-black/20 border border-white/5"
                  >
                    <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                    <div className="text-white font-medium mb-1">{stat.label}</div>
                    <div className="text-sm text-gray-400">{stat.sublabel}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
