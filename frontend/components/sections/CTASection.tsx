"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock, Users } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-32 px-4">
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
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl"></div>
            
            {/* Card */}
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-16 text-center overflow-hidden">
              {/* Floating elements */}
              <div className="absolute top-8 left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-8 right-8 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-500/10 rounded-full blur-lg"></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm mb-8"
                >
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-300 font-medium">
                    Join the AI Workflow Revolution
                  </span>
                </motion.div>

                {/* Main headline */}
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-5xl lg:text-7xl font-bold mb-8 leading-tight"
                >
                  <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                    Stop Fighting
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Buggy Tools
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
                >
                  Join thousands of developers and agencies who are tired of n8nChat's 3.2⭐ rating 
                  and broken outputs. Experience AI workflow generation that actually works.
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
                    <Clock className="w-8 h-8 text-green-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">4+ Hours</div>
                      <div className="text-gray-400">Saved per workflow</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <Users className="w-8 h-8 text-blue-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">10,000+</div>
                      <div className="text-gray-400">Frustrated n8nChat users</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">€55M</div>
                      <div className="text-gray-400">N8N market validation</div>
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
                  <motion.button
                    whileHover={{ 
                      scale: 1.05, 
                      boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)" 
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center gap-4">
                      <span>Start Building Now</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </motion.button>

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
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                  ))}
                </div>
                <blockquote className="text-xl text-gray-300 italic mb-6">
                  "Finally, an AI workflow generator that actually works! After being frustrated 
                  with n8nChat's bugs for months, N8N.AI saved me 20+ hours in the first week."
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
