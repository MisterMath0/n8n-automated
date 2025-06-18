"use client";

import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { ProblemSolutionSection } from "@/components/sections/ProblemSolutionSection";
import { CTASection } from "@/components/sections/CTASection";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BackgroundEffects } from "@/components/ui/BackgroundEffects";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      <BackgroundEffects />
      <Navbar />
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <ProblemSolutionSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
