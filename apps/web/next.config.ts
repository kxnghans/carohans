import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [],
  experimental: {
    // @ts-ignore
    allowedDevOrigins: ["10.0.0.13"],
  },
};

export default nextConfig;
