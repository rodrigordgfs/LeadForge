import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");

function readRootFile(name: string): string {
  return readFileSync(join(ROOT, name), "utf8");
}

describe("docker-compose.yml", () => {
  const compose = parseYaml(readRootFile("docker-compose.yml")) as {
    services: Record<string, { ports?: string[]; healthcheck?: unknown; volumes?: string[] }>;
    volumes: Record<string, unknown>;
  };

  it("defines postgres service on host port 5434", () => {
    expect(compose.services.postgres?.ports).toContain("5434:5432");
  });

  it("defines redis service on port 6379", () => {
    expect(compose.services.redis?.ports).toContain("6379:6379");
  });

  it("includes healthchecks for postgres and redis", () => {
    expect(compose.services.postgres?.healthcheck).toBeDefined();
    expect(compose.services.redis?.healthcheck).toBeDefined();
  });

  it("uses named volumes for persistence", () => {
    expect(compose.volumes).toHaveProperty("postgres_data");
    expect(compose.volumes).toHaveProperty("redis_data");
  });
});

describe(".env.example connection strings", () => {
  it("aligns DATABASE_URL and REDIS_URL with docker-compose defaults", () => {
    const envExample = readRootFile(".env.example");
    expect(envExample).toContain("postgresql://leadforge:leadforge@localhost:5434/leadforge");
    expect(envExample).toContain("redis://localhost:6379");
  });
});
