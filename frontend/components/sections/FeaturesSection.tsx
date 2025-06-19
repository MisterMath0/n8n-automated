"use client";

import { motion } from "framer-motion";
import { Eye, Zap, Shield, Rocket, Code, Globe } from "lucide-react";
import { EmailCollector } from "@/components/ui/EmailCollector";
import Link from 'next/link';
import { useState } from "react";

const features = [
  {
    icon: Zap,
    title: "30-Second Generation",
    description: "Turn any automation idea into a working workflow faster than you can describe it. No more 4-hour build sessions eating into your profits.",
    color: "from-green-500/30 to-green-500/10",
    highlight: "480x faster"
  },
  {
    icon: Shield,
    title: "Up To Date Nodes",
    description: "Every workflow imports perfectly into n8n. No broken connections, no missing nodes, no frustrated clients.",
    color: "from-blue-500/25 to-blue-500/5",
    highlight: "100% success rate"
  },
  {
    icon: Eye,
    title: "Preview Before You Commit",
    description: "See exactly how your workflow will look before importing. Make adjustments with confidence, deliver professional results every time.",
    color: "from-purple-500/30 to-purple-500/10",
    highlight: "No surprises"
  },
  {
    icon: Rocket,
    title: "Scale Your Business",
    description: "Handle 10x more client work without hiring more people. Scale your automation business without scaling your stress.",
    color: "from-orange-500/25 to-orange-500/10",
    highlight: "10x capacity"
  },
  {
    icon: Code,
    title: "Professional Quality",
    description: "Generate enterprise-grade workflows that impress clients and justify premium rates. No amateur outputs.",
    color: "from-cyan-500/30 to-cyan-500/10",
    highlight: "Enterprise-grade"
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    description: "No software to install, no browser extensions to break. Access your automation superpower from anywhere.",
    color: "from-indigo-500/25 to-indigo-500/10",
    highlight: "Always available"
  },
];

export function FeaturesSection() {
  const [showEmailCollector, setShowEmailCollector] = useState(false);
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

          <h2 className="text-2xl lg:text-3xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Why Automation Pros
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Choose N8N.AI
            </span>
          </h2>

          <p className="text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Stop wasting your talent on tedious setup work. Start delivering results 
            that wow clients and <span className="text-white font-semibold">boost your bottom line</span>.
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-white group-hover:text-gray-100 transition-colors">
                    {feature.title}
                  </h3>
                  <span className="px-2 py-1 bg-white/10 text-white/70 text-xs font-medium rounded-full border border-white/20">
                    {feature.highlight}
                  </span>
                </div>
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
              <h3 className="text-xl font-bold text-white mb-4">
              Ready to 10x Your Automation Business?
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join automation professionals who are earning more money in less time. 
              Stop competing on hours and start competing on <span className="text-white font-semibold">results</span>.
              </p>
              <motion.button
                onClick={() => setShowEmailCollector(true)}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-base shadow-2xl hover:shadow-green-500/25 transition-all duration-300 border border-green-400/30"
              >
                Join The Beta (FREE)
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Email Collector Modal */}
      <EmailCollector 
        isOpen={showEmailCollector}
        onClose={() => setShowEmailCollector(false)}
      />
    </section>
  );
}
