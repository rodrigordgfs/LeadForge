import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@leadforge/db", "@leadforge/shared"],
  serverExternalPackages: ["ioredis"],
};

export default nextConfig;
