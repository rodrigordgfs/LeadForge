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
    alias: [
      {
        find: "@leadforge/shared/publisher",
        replacement: path.resolve(
          __dirname,
          "../../packages/shared/src/events/publisher.ts",
        ),
      },
      {
        find: "@leadforge/shared/redis",
        replacement: path.resolve(
          __dirname,
          "../../packages/shared/src/events/redis-client.ts",
        ),
      },
      {
        find: "@leadforge/shared",
        replacement: path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      },
      {
        find: "@leadforge/ui",
        replacement: path.resolve(__dirname, "../../packages/ui/src/index.ts"),
      },
      {
        find: "@leadforge/db",
        replacement: path.resolve(__dirname, "../../packages/db/src/index.ts"),
      },
      {
        find: "@leadforge/queue",
        replacement: path.resolve(__dirname, "../../packages/queue/src/index.ts"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "."),
      },
    ],
  },
});
