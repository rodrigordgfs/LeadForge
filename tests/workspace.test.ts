import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");

function readRootFile(name: string): string {
  return readFileSync(join(ROOT, name), "utf8");
}

describe("pnpm workspace configuration", () => {
  it("includes apps/* and packages/* globs in pnpm-workspace.yaml", () => {
    const workspace = parseYaml(readRootFile("pnpm-workspace.yaml")) as {
      packages: string[];
    };

    expect(workspace.packages).toContain("apps/*");
    expect(workspace.packages).toContain("packages/*");
  });

  it("defines scoped placeholder packages in apps/ and packages/", () => {
    const expected = [
      "@leadforge/web",
      "@leadforge/worker",
      "@leadforge/db",
      "@leadforge/queue",
      "@leadforge/shared",
    ];

    for (const pkgName of expected) {
      const relativePath =
        pkgName === "@leadforge/web"
          ? "apps/web/package.json"
          : pkgName === "@leadforge/worker"
            ? "apps/worker/package.json"
            : pkgName === "@leadforge/db"
              ? "packages/db/package.json"
              : pkgName === "@leadforge/queue"
                ? "packages/queue/package.json"
                : "packages/shared/package.json";

      const pkg = JSON.parse(readRootFile(relativePath)) as { name: string };
      expect(pkg.name).toBe(pkgName);
    }
  });
});

describe(".env.example", () => {
  it("documents required TechSpec environment variables", () => {
    const envExample = readRootFile(".env.example");

    expect(envExample).toContain("DATABASE_URL");
    expect(envExample).toContain("REDIS_URL");
    expect(envExample).toContain("CLERK_SECRET_KEY");
    expect(envExample).toContain("OPENAI_API_KEY");
  });
});

describe("monorepo structure", () => {
  it("contains all five package shells under apps/ and packages/", () => {
    const paths = [
      "apps/web/package.json",
      "apps/worker/package.json",
      "packages/db/package.json",
      "packages/queue/package.json",
      "packages/shared/package.json",
    ];

    for (const path of paths) {
      expect(existsSync(join(ROOT, path))).toBe(true);
    }
  });

  it("contains per-package tsconfig stubs extending base config", () => {
    const paths = [
      "apps/worker/tsconfig.json",
      "packages/db/tsconfig.json",
      "packages/queue/tsconfig.json",
      "packages/shared/tsconfig.json",
    ];

    for (const path of paths) {
      const tsconfig = JSON.parse(readRootFile(path)) as { extends?: string };
      expect(tsconfig.extends).toContain("tsconfig.base.json");
    }

    const webTsconfig = JSON.parse(readRootFile("apps/web/tsconfig.json")) as {
      compilerOptions?: { plugins?: Array<{ name: string }> };
    };
    expect(webTsconfig.compilerOptions?.plugins?.[0]?.name).toBe("next");
  });
});

describe("turbo pipeline integration", () => {
  it("runs pnpm turbo lint with exit code 0", () => {
    const result = execSync("pnpm turbo lint", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it("runs pnpm turbo test with exit code 0", () => {
    const result = execSync("pnpm turbo test", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});
