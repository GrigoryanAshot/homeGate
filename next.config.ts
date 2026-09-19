import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["@prisma/client", "prisma"],
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/gate",
        permanent: false,
      },
      {
        source: "/smartgate-demo",
        destination: "/gate",
        permanent: true,
      },
      {
        source: "/smartgate-demo/:path*",
        destination: "/gate",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
