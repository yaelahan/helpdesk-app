import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A stray pnpm-lock.yaml in the parent home directory otherwise makes
  // Turbopack guess the wrong monorepo root.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
