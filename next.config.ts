import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators:false,
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
