import { describe, expect, it } from "vitest";
import { classifyUrl } from "../src/audit/url-classifier.js";

describe("url classifier", () => {
  it("marks instagram.com/profile as hasRealWebsite=false", () => {
    const result = classifyUrl("https://instagram.com/loja-local");
    expect(result.hasRealWebsite).toBe(false);
    expect(result.ownDomain).toBe(false);
  });

  it("marks custom domain as hasRealWebsite=true", () => {
    const result = classifyUrl("https://auto-center-silva.com.br");
    expect(result.hasRealWebsite).toBe(true);
    expect(result.ownDomain).toBe(true);
  });

  it("marks yelp as not a real website", () => {
    const result = classifyUrl("https://www.yelp.com/biz/example");
    expect(result.hasRealWebsite).toBe(false);
  });

  it("marks third-party subdomain as not own domain", () => {
    const result = classifyUrl("https://empresa.wixsite.com/site");
    expect(result.hasRealWebsite).toBe(true);
    expect(result.ownDomain).toBe(false);
  });
});
