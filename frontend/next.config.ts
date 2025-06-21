import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  images: {
    unoptimized: true, // For better Docker compatibility
  },
  // Disable telemetry for production
  telemetry: false,
};

export default nextConfig;
