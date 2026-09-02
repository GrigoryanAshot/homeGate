import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/smartgate-demo",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
