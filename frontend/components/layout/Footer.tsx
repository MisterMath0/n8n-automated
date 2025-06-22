"use client";

import { motion } from "framer-motion";
import { Zap, Github, Twitter, Mail, ExternalLink } from "lucide-react";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Demo", href: "#demo" },
    { name: "Changelog", href: "/changelog" },
  ],
  resources: [
    { name: "Documentation", href: "/docs" },
    { name: "API Reference", href: "/api" },
    { name: "N8N Templates", href: "/templates" },
    { name: "Blog", href: "/blog" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ],
  competitors: [
    { name: "vs n8nChat", href: "/compare/n8nchat" },
    { name: "vs Retorno.io", href: "/compare/retorno" },
    { name: "vs Manual Building", href: "/compare/manual" },
    { name: "Migration Guide", href: "/migrate" },
  ]
};

const socialLinks = [
  { name: "GitHub", href: "https://github.com", icon: Github },
  { name: "Twitter", href: "https://twitter.com", icon: Twitter },
  { name: "Email", href: "mailto:hello@n8n-ai.com", icon: Mail },
];

export function Footer() {
  return (
    <footer className="relative border-t border-gray-800/50 bg-black/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 rounded-xl flex items-center justify-center border border-white/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-white/20 to-white/10 rounded-xl blur opacity-30"></div>
              </div>
              <span className="text-2xl font-bold text-white">Autokraft</span>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              The AI-powered N8N workflow generator that actually works. 
              Built for developers frustrated with buggy tools and broken outputs.
            </p>

            <div className="flex items-center gap-4">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
                >
                  <link.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <h3 className="font-semibold text-white mb-4 capitalize">
                {category === "competitors" ? "Comparisons" : category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                    >
                      {link.name}
                      {link.href.startsWith("http") && (
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="border-t border-gray-800/50 pt-8 mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-white mb-1">480x</div>
              <div className="text-sm text-gray-500">Faster Than Manual</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-300 mb-1">100%</div>
              <div className="text-sm text-gray-500">Working Outputs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-100 mb-1">30 sec</div>
              <div className="text-sm text-gray-500">Average Generation</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white/80 mb-1">€400+</div>
              <div className="text-sm text-gray-500">Saved Per Workflow</div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="border-t border-gray-800/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="text-gray-500 text-sm">
            © 2025 Autokraft. Streamlining workflow automation for developers worldwide.
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="/status" className="hover:text-gray-300 transition-colors">
              Status
            </a>
            <a href="/security" className="hover:text-gray-300 transition-colors">
              Security
            </a>
            <a href="/cookies" className="hover:text-gray-300 transition-colors">
              Cookies
            </a>
          </div>
        </motion.div>

        {/* Easter Egg */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 1.5 }}
          className="text-center mt-8"
        >
          <p className="text-xs text-gray-600">
            Made with ⚡ to accelerate N8N workflow development
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
