import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  webpack: (config) => {
    config.externals.push(
      "pino-pretty",
      "lokijs",
      "encoding",
      // React-Native-only dependency referenced by @metamask/sdk; not
      // needed (or resolvable) in a web build.
      "@react-native-async-storage/async-storage"
    );
    return config;
  },
};

export default nextConfig;
