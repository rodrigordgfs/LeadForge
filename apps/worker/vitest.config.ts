import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@leadforge/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@leadforge/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
      "@leadforge/queue": path.resolve(__dirname, "../../packages/queue/src/index.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      thresholds: {
        lines: 80,
        statements: 80,
      },
    },
  },
});
