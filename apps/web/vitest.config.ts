import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@leadforge/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@leadforge/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
      "@leadforge/queue": path.resolve(__dirname, "../../packages/queue/src/index.ts"),
    },
  },
});
