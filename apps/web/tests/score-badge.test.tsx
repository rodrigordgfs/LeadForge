import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ScoreBadge } from "@/components/leads/score-badge";
import { WebsiteStatus } from "@/components/leads/website-status";

describe("ScoreBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders red styling for score 35 (critical band)", () => {
    render(<ScoreBadge score={35} band="critical" />);

    const badge = screen.getByTestId("score-badge");
    expect(badge.textContent).toContain("35");
    expect(badge.textContent).toContain("Crítico");
    expect(badge.className).toContain("bg-red-100");
  });

  it("renders green styling for score 85 (excellent band)", () => {
    render(<ScoreBadge score={85} band="excellent" />);

    const badge = screen.getByTestId("score-badge");
    expect(badge.textContent).toContain("85");
    expect(badge.textContent).toContain("Excelente");
    expect(badge.className).toContain("bg-green-100");
  });
});

describe("WebsiteStatus", () => {
  afterEach(() => {
    cleanup();
  });

  it('shows "Sem site" when hasRealWebsite=false', () => {
    render(<WebsiteStatus hasRealWebsite={false} />);

    expect(screen.getByTestId("website-status").textContent).toBe("Sem site");
  });
});
