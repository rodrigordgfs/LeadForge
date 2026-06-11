import { describe, expect, it } from "vitest";

import { isPublicRoute } from "@/lib/middleware-config";

describe("middleware public route logic", () => {
  it("allows /api/health without authentication", () => {
    expect(isPublicRoute("/api/health")).toBe(true);
  });

  it("allows sign-in routes without authentication", () => {
    expect(isPublicRoute("/sign-in")).toBe(true);
    expect(isPublicRoute("/sign-in/factor-one")).toBe(true);
  });

  it("allows sign-up routes without authentication", () => {
    expect(isPublicRoute("/sign-up")).toBe(true);
    expect(isPublicRoute("/sign-up/verify-email-address")).toBe(true);
  });

  it("blocks /api/searches without session", () => {
    expect(isPublicRoute("/api/searches")).toBe(false);
  });

  it("blocks protected app routes without session", () => {
    expect(isPublicRoute("/")).toBe(false);
    expect(isPublicRoute("/crm")).toBe(false);
  });
});
