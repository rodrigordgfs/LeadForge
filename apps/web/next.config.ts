import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@leadforge/db", "@leadforge/shared", "@leadforge/ui"],
  serverExternalPackages: ["@prisma/client", "ioredis"],
};

export default nextConfig;
