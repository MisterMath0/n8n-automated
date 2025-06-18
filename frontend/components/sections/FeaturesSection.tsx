"use client";

import { motion } from "framer-motion";
import { Eye, Zap, Shield, Rocket, Code, Globe } from "lucide-react";
import Link from 'next/link';

const features = [
  {
    icon: Eye,
    title: "Visual Preview",
    description: "See workflows before importing with ReactFlow integration. No more blind JSON imports.",
    color: "from-white/30 to-white/10",
  },
  {
    icon: Shield,
    title: "Smart Validation",
    description: "Checks if nodes actually exist in N8N. Auto-fixes broken connections and missing parameters.",
    color: "from-white/25 to-white/5",
  },
  {
    icon: Zap,
    title: "No API Keys",
    description: "Built-in AI, no user setup required. Start generating workflows immediately.",
    color: "from-white/35 to-white/15",
  },
  {
    icon: Globe,
    title: "Cross-Platform",
    description: "Web app that works everywhere. No Chrome-only browser extension limitations.",
    color: "from-white/20 to-white/5",
  },
  {
    icon: Code,
    title: "Perfect JSON",
    description: "Generates working N8N JSON that imports cleanly. No manual fixing required.",
    color: "from-white/30 to-white/10",
  },
  {
    icon: Rocket,
    title: "Lightning Fast",
    description: "Generate complex workflows in seconds. 10x faster than manual building.",
    color: "from-white/25 to-white/10",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4">
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm mb-6"
          >
            <Zap className="w-4 h-4 text-white/70" />
            <span className="text-white/70 text-sm font-medium">
              Advanced Features
            </span>
          </motion.div>

          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Build Workflows
            </span>
            <br />
            <span className="bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent">
              10x Faster
            </span>
          </h2>

          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Stop wasting hours on manual workflow building. Generate, preview, and export 
            professional N8N automations in seconds.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative"
            >
              {/* Glow effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${feature.color} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500`}></div>
              
              {/* Card */}
              <div className="relative glass-card rounded-2xl p-8 h-full hover:border-gray-600/50 transition-all duration-300">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center border border-white/20`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className={`absolute -inset-2 bg-gradient-to-r ${feature.color} rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition duration-300`}></div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-gray-100 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>

                {/* Hover indicator */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-r from-white/40 to-white/20 rounded-full"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="text-center mt-20"
        >
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl blur-xl"></div>
            <div className="relative glass-dark rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Save Hours Every Week?
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join developers and agencies who've streamlined their workflow creation process. 
              Start building faster, more reliable N8N automations today.
              </p>
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-white/20 to-white/10 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-white/10 transition-all duration-300 border border-white/20 backdrop-blur-sm"
                >
                  Start Building Now
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
