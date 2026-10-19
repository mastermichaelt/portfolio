import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose Vercel's deploy environment to the client for analytics filtering.
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
  // Case-study social cards are read with fs at runtime, which file tracing
  // cannot follow; ship them with the routes that read them.
  outputFileTracingIncludes: {
    "/projects/\\[slug\\]": ["./app/projects/[[]slug]/_cards/*.png"],
    "/projects/\\[slug\\]/opengraph-image": [
      "./app/projects/[[]slug]/_cards/*.png",
    ],
  },
};

export default nextConfig;
