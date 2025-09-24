import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.dirname(new URL(import.meta.url).pathname);

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript build errors during production builds
    ignoreBuildErrors: true,
  },
  turbopack: {
    // Explicitly set the root to avoid incorrect workspace root inference
    root: projectRoot,
  },
};

export default nextConfig;
