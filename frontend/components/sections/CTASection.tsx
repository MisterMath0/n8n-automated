"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock, Users, Shield, TrendingUp, AlertTriangle, Bot } from "lucide-react";
import Link from "next/link";

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
            <div className="absolute -inset-8 bg-gradient-to-r from-red-500/10 via-orange-500/5 to-red-500/10 rounded-3xl blur-2xl"></div>
            
            {/* Card */}
            <div className="relative bg-gradient-to-br from-black/90 to-black/90 backdrop-blur-sm border border-red-500/30 rounded-3xl p-16 text-center overflow-hidden">
              {/* Floating elements */}
              <div className="absolute top-8 left-8 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-8 right-8 w-32 h-32 bg-orange-500/5 rounded-full blur-xl"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-red-500/8 rounded-full blur-lg"></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-400/30 bg-red-500/10 backdrop-blur-sm mb-6"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium">
                    Limited Beta Spots Remaining
                  </span>
                </motion.div>

                {/* Main headline */}
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl lg:text-4xl font-bold mb-6 leading-tight"
                >
                  <span className="text-red-400">
                    Don't Let Your
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Competitors
                  </span>
                  <br />
                  <span className="text-white">Get The Advantage</span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="text-base text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed"
                >
                  The automation market is moving fast. While you're stuck building workflows manually, 
                  <span className="text-white font-semibold"> early beta users are already winning bigger projects</span> with faster delivery.
                </motion.p>

                {/* Beta Benefits */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="grid md:grid-cols-4 gap-6 mb-12"
                >
                  {[
                    { icon: Users, text: "Only 500 spots", detail: "Exclusive access" },
                    { icon: Shield, text: "No payment required", detail: "Completely free" },
                    { icon: TrendingUp, text: "Lifetime discount", detail: "For beta users" },
                    { icon: Sparkles, text: "Priority support", detail: "Direct feedback" }
                  ].map((benefit, index) => (
                    <motion.div
                      key={benefit.text}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="text-center p-4 glass-card rounded-xl border border-white/10"
                    >
                      <benefit.icon className="w-8 h-8 text-green-400 mx-auto mb-3" />
                      <div className="text-white font-semibold text-sm mb-1">{benefit.text}</div>
                      <div className="text-gray-400 text-xs">{benefit.detail}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.2 }}
                  className="mb-8"
                >
                  <Link href="/auth/signup">
                    <motion.button
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 20px 40px rgba(34, 197, 94, 0.4)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-base shadow-2xl overflow-hidden border border-green-400/30"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-center gap-3">
                        <Bot className="w-6 h-6" />
                        Secure My Beta Access (FREE)
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.button>
                  </Link>
                  <p className="text-gray-400 text-sm mt-4">
                    Beta spots are filling fast. Secure yours before your competition does.
                  </p>
                </motion.div>

                {/* Urgency Counter */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.4 }}
                  className="text-gray-400"
                >
                  <p className="text-lg">
                    ✅ No payment required • ✅ Cancel anytime • ✅ Full support included
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
            transition={{ delay: 1.6 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="bg-black/60 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-green-400 text-2xl">⭐</span>
                  ))}
                </div>
                <blockquote className="text-xl text-gray-300 italic mb-6">
                  "I just saved 3.5 hours on a client project. That's an extra $350 in my pocket 
                  for the same deliverable. This tool is pure gold."
                </blockquote>
                <div className="text-gray-400">
                  <div className="font-semibold text-white">Sarah Chen</div>
                  <div>Automation Consultant • Beta User</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
