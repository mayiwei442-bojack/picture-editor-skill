import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/generate": ["./src/lib/server/assets/*"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
