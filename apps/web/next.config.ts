import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@linkdo/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "static.a1ex.online",
      },
    ],
  },
};

export default nextConfig;
