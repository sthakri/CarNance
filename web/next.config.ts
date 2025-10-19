import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip ESLint during `next build` (use `npm run lint` or editor for linting)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
