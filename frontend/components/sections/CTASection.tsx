"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock, Users } from "lucide-react";
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Main CTA Card */}
          <div className="relative">
            {/* Animated background */}
            <div className="absolute -inset-8 bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-3xl blur-2xl"></div>
            
            {/* Card */}
            <div className="relative bg-gradient-to-br from-black/90 to-black/90 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-16 text-center overflow-hidden">
              {/* Floating elements */}
              <div className="absolute top-8 left-8 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
              <div className="absolute bottom-8 right-8 w-32 h-32 bg-white/3 rounded-full blur-xl"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/4 rounded-full blur-lg"></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm mb-8"
                >
                  <Sparkles className="w-5 h-5 text-white/70" />
                  <span className="text-white/70 font-medium">
                    Start Building Faster Workflows
                  </span>
                </motion.div>

                {/* Main headline */}
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl lg:text-6xl font-bold mb-6 leading-tight"
                >
                  <span className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                    Transform Your
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-gray-300 via-white to-gray-100 bg-clip-text text-transparent">
                    Workflow Process
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="text-xl text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed"
                >
                  Transform your workflow building process. Generate professional N8N automations 
                  in seconds with visual previews and perfect JSON exports.
                </motion.p>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="w-8 h-8 text-white/70" />
                    <div>
                      <div className="text-2xl font-bold text-white">5 Minutes</div>
                      <div className="text-gray-400">To get started</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <Users className="w-8 h-8 text-white/70" />
                    <div>
                      <div className="text-2xl font-bold text-white">1000+</div>
                      <div className="text-gray-400">Workflows generated</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="w-8 h-8 text-white/70" />
                    <div>
                      <div className="text-2xl font-bold text-white">30 Sec</div>
                      <div className="text-gray-400">Average generation time</div>
                    </div>
                  </div>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1 }}
                  className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                >
                  <Link href="/signup">
                    <motion.button
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 25px 50px rgba(255, 255, 255, 0.1)" 
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative px-12 py-6 bg-gradient-to-r from-white/20 to-white/10 text-white rounded-2xl font-bold text-xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-center gap-4">
                        <span>Start Building Now</span>
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </motion.button>
                  </Link>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-12 py-6 border-2 border-white/20 text-white rounded-2xl font-bold text-xl backdrop-blur-sm hover:bg-white/5 transition-all duration-300"
                  >
                    Watch Demo First
                  </motion.button>
                </motion.div>

                {/* Social proof */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.2 }}
                  className="mt-12 text-gray-400"
                >
                  <p className="text-lg">
                    Free to start • No credit card required • 30-day money-back guarantee
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Bottom testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.4 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="bg-black/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                  ))}
                </div>
                <blockquote className="text-xl text-gray-300 italic mb-6">
                  "N8N.AI saved me 20+ hours in the first week. The visual preview feature 
                  is exactly what I needed to validate workflows before importing."
                </blockquote>
                <div className="text-gray-400">
                  <div className="font-semibold text-white">Sarah Chen</div>
                  <div>Automation Consultant, TechFlow Agency</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
