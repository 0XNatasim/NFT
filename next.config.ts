import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // React-Native-only dependency referenced by @metamask/sdk; stub it
    // out for web builds.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

export default nextConfig;
