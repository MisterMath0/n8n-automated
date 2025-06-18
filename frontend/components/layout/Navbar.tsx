"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "Demo", href: "#demo" },
    { name: "Pricing", href: "#pricing" },
    { name: "Docs", href: "#docs" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          {/* Glass morphism container */}
          <div className="glass-dark rounded-2xl px-6 py-3 shadow-2xl">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-white/30 to-white/10 rounded-lg flex items-center justify-center border border-white/20">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-white/20 to-white/10 rounded-lg blur opacity-30"></div>
                </div>
                <span className="text-xl font-bold text-white">N8N.AI</span>
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                {navItems.map((item, index) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    whileHover={{ y: -2 }}
                    className="text-gray-300 hover:text-white transition-colors duration-300 relative group"
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-white to-gray-300 group-hover:w-full transition-all duration-300"></span>
                  </motion.a>
                ))}
              </div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="hidden md:block"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255, 255, 255, 0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-white/20 to-white/10 text-white rounded-lg font-medium shadow-lg hover:shadow-white/10 transition-all duration-300 border border-white/20 backdrop-blur-sm"
                >
                  Get Started
                </motion.button>
              </motion.div>

              {/* Mobile menu button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden text-gray-300 hover:text-white transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-2 md:hidden"
            >
              <div className="glass-dark rounded-2xl p-6 shadow-2xl">
                <div className="flex flex-col gap-4">
                  {navItems.map((item, index) => (
                    <motion.a
                      key={item.name}
                      href={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setIsOpen(false)}
                      className="text-gray-300 hover:text-white transition-colors duration-300 py-2"
                    >
                      {item.name}
                    </motion.a>
                  ))}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-white/20 to-white/10 text-white rounded-lg font-medium shadow-lg border border-white/20 backdrop-blur-sm"
                  >
                    Get Started
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
