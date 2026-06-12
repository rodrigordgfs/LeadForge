import { describe, expect, it } from "vitest";

import { geistTokens } from "../src/tokens/geist-tokens.js";

describe("geistTokens", () => {
  it("defines light theme anchor colors", () => {
    expect(geistTokens.light.background).toBe("#fafafa");
    expect(geistTokens.light.foreground).toBe("#171717");
  });

  it("defines dark theme anchor colors", () => {
    expect(geistTokens.dark.background).toBe("#0a0a0a");
    expect(geistTokens.dark.foreground).toBe("#ededed");
  });

  it("defines semantic colors per TechSpec", () => {
    expect(geistTokens.light.destructive).toBe("#e5484d");
    expect(geistTokens.light.success).toBe("#46a758");
    expect(geistTokens.light.warning).toBe("#ffb224");
    expect(geistTokens.dark.destructive).toBe("#e5484d");
  });

  it("defines 4px baseline spacing steps", () => {
    expect(geistTokens.spacing["1"]).toBe("4px");
    expect(geistTokens.spacing["2"]).toBe("8px");
    expect(geistTokens.spacing["4"]).toBe("16px");
    expect(geistTokens.spacing["6"]).toBe("24px");
    expect(geistTokens.spacing["8"]).toBe("32px");
  });

  it("defines radius tokens including pill", () => {
    expect(geistTokens.radius.md).toBe("6px");
    expect(geistTokens.radius.pill).toBe("9999px");
  });

  it("defines Geist font family names", () => {
    expect(geistTokens.fontSans).toBe("Geist Sans");
    expect(geistTokens.fontMono).toBe("Geist Mono");
  });
});
