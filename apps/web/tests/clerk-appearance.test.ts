import { describe, expect, it } from "vitest";

import { clerkAppearance } from "@/lib/clerk-appearance";

describe("clerkAppearance", () => {
  it("references CSS variables instead of hardcoded hex colors", () => {
    expect(clerkAppearance.variables?.colorBackground).toMatch(/^var\(--/);
    expect(clerkAppearance.variables?.colorBackground).not.toMatch(/^#/);
    expect(clerkAppearance.variables?.colorText).toMatch(/^var\(--/);
    expect(clerkAppearance.variables?.colorPrimary).toMatch(/^var\(--/);
  });

  it("uses Geist Sans font variable", () => {
    expect(clerkAppearance.variables?.fontFamily).toContain("--font-geist-sans");
  });
});
