"use client";

import { motion } from "framer-motion";
import { DollarSign, Clock, AlertTriangle, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import { EmailCollector } from "@/components/ui/EmailCollector";
import { useState } from "react";
import Link from 'next/link';

const problems = [
  {
    icon: Clock,
    title: "4 Hours Average Setup Time",
    description: "Every workflow eats into your profits",
    cost: "$400+ lost revenue",
    color: "text-red-400"
  },
  {
    icon: AlertTriangle,
    title: "Endless Debugging",
    description: "Broken connections and failed imports",
    cost: "Client frustration",
    color: "text-orange-400"
  },
  {
    icon: DollarSign,
    title: "Missed Opportunities",
    description: "Stuck on technical work instead of sales",
    cost: "Limited growth",
    color: "text-yellow-400"
  }
];

const solutions = [
  {
    icon: TrendingUp,
    title: "30-Second Generation",
    description: "Turn ideas into working workflows instantly",
    benefit: "480x faster delivery",
    color: "text-green-400"
  },
  {
    icon: CheckCircle,
    title: "Guaranteed Imports",
    description: "Perfect workflows that work first time",    benefit: "100% success rate",
    color: "text-blue-400"
  },
  {
    icon: ArrowRight,
    title: "Scale Without Stress",
    description: "Handle 10x more projects same time",
    benefit: "10x business growth",
    color: "text-purple-400"
  }
];

const testimonials = [
  {
    quote: "I went from 4-5 workflows per week to 15-20. Same quality, same expertise, but now I'm making 3x more money in the same time.",
    author: "Sarah Chen",
    role: "Automation Consultant",
    revenue: "+300% revenue"
  },
  {
    quote: "Our team's productivity shot through the roof. We're delivering projects faster and taking on bigger clients. This tool paid for itself in the first week.",
    author: "Mike Rodriguez", 
    role: "Digital Agency Owner",
    revenue: "ROI in 1 week"
  },
  {
    quote: "Finally, a tool that actually works. No more debugging broken imports or explaining delays to stakeholders.",
    author: "Jennifer Liu",
    role: "Enterprise Automation Lead", 
    revenue: "Zero delays"
  }
];

export function ProblemSolutionSection() {
  const [showEmailCollector, setShowEmailCollector] = useState(false);

  return (
    <section id="problem-solution" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Problem Section */}
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-red-400/30 bg-red-500/10 backdrop-blur-sm mb-6"
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">
              The Hidden Cost Crisis
            </span>
          </motion.div>

          <h2 className="text-2xl lg:text-4xl font-bold mb-6">
            <span className="text-red-400">
              Every Hour You Spend
            </span>
            <br />
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Building Manually
            </span>
            <br />
            <span className="text-white">Is Money Out of Your Pocket</span>
          </h2>

          <p className="text-base text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
            While you're stuck configuring nodes and debugging connections, your competitors 
            are winning projects and scaling their businesses.
          </p>

          {/* Problem Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {problems.map((problem, index) => (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all duration-300"
              >
                <problem.icon className={`w-8 h-8 ${problem.color} mb-4 mx-auto`} />
                <h3 className="text-lg font-semibold text-white mb-2">{problem.title}</h3>
                <p className="text-gray-400 mb-3">{problem.description}</p>
                <div className={`text-sm font-medium ${problem.color}`}>{problem.cost}</div>
              </motion.div>
            ))}
          </div>

          {/* ROI Calculation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur-xl"></div>
            <div className="relative glass-dark rounded-3xl p-8 border border-red-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">The Real Cost Calculator</h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-red-400 mb-2">4 hours</div>
                  <div className="text-gray-300">Average workflow build time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-400 mb-2">$100/hr</div>
                  <div className="text-gray-300">Standard consulting rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-400 mb-2">$400</div>
                  <div className="text-gray-300">Lost per workflow</div>
                </div>
              </div>
              <p className="text-gray-400 mt-6 text-center">
                Building just 5 workflows manually = <span className="text-red-400 font-bold">$2,000 lost revenue per week</span>
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Solution Section */}
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-green-400/30 bg-green-500/10 backdrop-blur-sm mb-6"
          >
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">
              The Smart Solution
            </span>
          </motion.div>

          <h2 className="text-2xl lg:text-4xl font-bold mb-6">
            <span className="text-green-400">
              What If You Could
            </span>
            <br />
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Deliver The Same Quality
            </span>
            <br />
            <span className="text-white">In 30 Seconds?</span>
          </h2>

          <p className="text-base text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
            That's exactly what Autokraft does. Spend your time on high-value strategy 
            and client relationships, <span className="text-white font-semibold">not technical busy work</span>.
          </p>

          {/* Solution Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {solutions.map((solution, index) => (
              <motion.div
                key={solution.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 group"
              >
                <solution.icon className={`w-8 h-8 ${solution.color} mb-4 mx-auto group-hover:scale-110 transition-transform`} />
                <h3 className="text-lg font-semibold text-white mb-2">{solution.title}</h3>
                <p className="text-gray-400 mb-3">{solution.description}</p>
                <div className={`text-sm font-medium ${solution.color}`}>{solution.benefit}</div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              onClick={() => setShowEmailCollector(true)}
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-base shadow-2xl hover:shadow-green-500/25 transition-all duration-300 border border-green-400/30"
            >
              <Link href="/auth/signup">Stop Losing Money - Join Beta FREE</Link>
            </motion.button>
            <p className="text-gray-400 mt-4 text-sm">
              Limited spots • No payment required • Lifetime discount for beta users
            </p>
          </motion.div>
        </motion.div>

        {/* Social Proof Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white mb-4">Automation Professionals Are Already Winning</h3>
            <p className="text-gray-400">Real results from real users in beta</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-400">
                    <div className="font-semibold text-white">{testimonial.author}</div>
                    <div>{testimonial.role}</div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                    {testimonial.revenue}
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.quote}"</p>
              </motion.div>
            ))}
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
