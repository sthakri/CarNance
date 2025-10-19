import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Skip running ESLint during `next build` to speed up CI or local builds.
    // Next.js will still respect `npm run lint` and your editor integrations.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
