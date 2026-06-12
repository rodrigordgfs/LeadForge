import { describe, expect, it } from "vitest";

import { cn, geistTokens } from "../src/index.js";
import { geistTokens as tokensDirect } from "../src/tokens/geist-tokens.js";

describe("@leadforge/ui exports", () => {
  it("resolves main package exports", () => {
    expect(geistTokens.light.background).toBe("#fafafa");
    expect(cn("a", false, "b")).toBe("a b");
  });

  it("resolves tokens subpath export", () => {
    expect(tokensDirect.dark.foreground).toBe("#ededed");
  });
});
