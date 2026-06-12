import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ScoreBadge } from "@/components/leads/score-badge";
import { WebsiteStatus } from "@/components/leads/website-status";

describe("ScoreBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders Badge with critical variant for score 35", () => {
    render(<ScoreBadge score={35} band="critical" />);

    const badge = screen.getByTestId("score-badge");
    expect(badge.textContent).toContain("35");
    expect(badge.textContent).toContain("Crítico");
    expect(badge.getAttribute("data-variant")).toBe("critical");
  });

  it("renders Badge with excellent variant for score 85", () => {
    render(<ScoreBadge score={85} band="excellent" />);

    const badge = screen.getByTestId("score-badge");
    expect(badge.textContent).toContain("85");
    expect(badge.textContent).toContain("Excelente");
    expect(badge.getAttribute("data-variant")).toBe("excellent");
  });
});

describe("WebsiteStatus", () => {
  afterEach(() => {
    cleanup();
  });

  it('shows "Sem site" with secondary variant when hasRealWebsite=false', () => {
    render(<WebsiteStatus hasRealWebsite={false} />);

    const badge = screen.getByTestId("website-status");
    expect(badge.textContent).toBe("Sem site");
    expect(badge.getAttribute("data-variant")).toBe("secondary");
  });

  it('shows "Site ok" with excellent variant when hasRealWebsite=true and score > 60', () => {
    render(<WebsiteStatus hasRealWebsite={true} score={75} />);

    const badge = screen.getByTestId("website-status");
    expect(badge.textContent).toBe("Site ok");
    expect(badge.getAttribute("data-variant")).toBe("excellent");
  });
});
