import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: "automatic",
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
        find: "@leadforge/ui/tokens",
        replacement: path.resolve(
          __dirname,
          "../../packages/ui/src/tokens/geist-tokens.ts",
        ),
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
    ],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      thresholds: {
        lines: 80,
        statements: 80,
      },
    },
  },
});
