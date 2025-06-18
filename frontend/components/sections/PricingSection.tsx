"use client";

import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for trying out N8N.AI",
    features: [
      "5 workflows per month",
      "Basic visual preview", 
      "Standard validation",
      "Community support",
      "Export to JSON"
    ],
    cta: "Get Started",
    popular: false,
    icon: Zap,
    color: "from-white/20 to-white/10",
    ctaColor: "from-white/15 to-white/5"
  },
  {
    name: "Professional", 
    price: "€29",
    period: "/month",
    description: "For agencies & power users",
    features: [
      "Unlimited workflows",
      "Advanced visual preview",
      "Smart auto-fixing",
      "Priority support", 
      "N8N instance integration",
      "Custom node templates",
      "Workflow analytics"
    ],
    cta: "Start Free Trial",
    popular: true,
    icon: Crown,
    color: "from-white/30 to-white/15",
    ctaColor: "from-white/25 to-white/10"
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams & organizations",
    features: [
      "Everything in Professional",
      "Team collaboration",
      "SSO authentication",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantees",
      "White-label options"
    ],
    cta: "Contact Sales",
    popular: false,
    icon: Rocket,
    color: "from-white/25 to-white/10", 
    ctaColor: "from-white/20 to-white/5"
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4">
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
            <Crown className="w-4 h-4 text-white/70" />
            <span className="text-white/70 text-sm font-medium">
              Transparent Pricing
            </span>
          </motion.div>

          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Start Saving
            </span>
            <br />
            <span className="bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent">
              Time Today
            </span>
          </h2>

          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Choose the plan that fits your workflow automation needs. All plans include 
            visual previews, smart validation, and perfect JSON exports.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className={`relative group ${plan.popular ? 'lg:scale-105' : ''}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 + 0.3 }}
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                >
                  <div className="bg-gradient-to-r from-white/25 to-white/15 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg border border-white/20 backdrop-blur-sm">
                    Most Popular
                  </div>
                </motion.div>
              )}

              {/* Glow effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${plan.color} rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500`}></div>
              
              {/* Card */}
              <div className={`relative bg-black/80 backdrop-blur-sm border rounded-3xl p-8 h-full transition-all duration-300 ${
                plan.popular 
                  ? 'border-white/30 shadow-2xl shadow-white/5' 
                  : 'border-gray-700/50 hover:border-gray-600/50'
              }`}>
                {/* Icon */}
                <div className="mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center border border-white/20`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Plan name */}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-400">{plan.period}</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-white/70 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 bg-gradient-to-r ${plan.ctaColor} text-white rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 border border-white/20 backdrop-blur-sm`}
                >
                  {plan.cta}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ROI Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl blur-xl"></div>
            
            {/* Card */}
            <div className="relative bg-black/80 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-12">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-4">ROI Calculator</h3>
                <p className="text-gray-300 text-lg">See how much N8N.AI saves you</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-white mb-2">4+ hours</div>
                  <div className="text-gray-300">Saved per workflow</div>
                  <div className="text-sm text-gray-500 mt-2">vs manual building</div>
                </div>
                
                <div>
                  <div className="text-4xl font-bold text-gray-300 mb-2">€100/hr</div>
                  <div className="text-gray-300">Typical agency rate</div>
                  <div className="text-sm text-gray-500 mt-2">automation consultant</div>
                </div>
                
                <div>
                  <div className="text-4xl font-bold text-gray-100 mb-2">€400+</div>
                  <div className="text-gray-300">Saved per workflow</div>
                  <div className="text-sm text-gray-500 mt-2">ROI: 1,379%</div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-300 text-lg mb-6">
                  Professional plan pays for itself with just <span className="text-white font-semibold">one workflow</span> saved
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-white/20 to-white/10 text-white rounded-xl font-semibold text-lg shadow-lg border border-white/20 backdrop-blur-sm"
                >
                  Start Saving Time Today
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-black/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-left">
              <h4 className="font-semibold text-white mb-3">How accurate are the generated workflows?</h4>
              <p className="text-gray-300 text-sm">Our AI generates working N8N workflows with smart validation and auto-fixing. Visual previews let you verify before exporting.</p>
            </div>
            <div className="bg-black/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-left">
              <h4 className="font-semibold text-white mb-3">Do I need API keys?</h4>
              <p className="text-gray-300 text-sm">No! Built-in AI means you can start generating workflows immediately without complex setup.</p>
            </div>
            <div className="bg-black/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-left">
              <h4 className="font-semibold text-white mb-3">Can I export to my N8N instance?</h4>
              <p className="text-gray-300 text-sm">Yes! Perfect JSON exports that import cleanly. Professional plan includes direct instance integration.</p>
            </div>
            <div className="bg-black/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-left">
              <h4 className="font-semibold text-white mb-3">What's the refund policy?</h4>
              <p className="text-gray-300 text-sm">30-day money-back guarantee. If it doesn't save you time, get your money back.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
