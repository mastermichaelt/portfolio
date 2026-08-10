import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose Vercel's deploy environment to the client for analytics filtering.
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
};

export default nextConfig;
