import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    environmentMatchGlobs: [
      ["tests/**/*.test.tsx", "jsdom"],
      ["tests/use-job-events.test.ts", "jsdom"],
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@leadforge/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@leadforge/shared/redis": path.resolve(
        __dirname,
        "../../packages/shared/src/events/redis-client.ts",
      ),
      "@leadforge/shared/publisher": path.resolve(
        __dirname,
        "../../packages/shared/src/events/publisher.ts",
      ),
      "@leadforge/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
      "@leadforge/queue": path.resolve(__dirname, "../../packages/queue/src/index.ts"),
    },
  },
});
