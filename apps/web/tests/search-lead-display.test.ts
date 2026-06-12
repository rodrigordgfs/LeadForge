import { describe, expect, it } from "vitest";

import {
  formatSearchLeadLabel,
  getSearchLeadSecondaryHint,
} from "@/lib/search/search-lead-display";

describe("search lead display", () => {
  it("shows Maps count while search is running and leads are not saved yet", () => {
    const search = {
      status: "running",
      leadCount: 0,
      totalFound: 111,
    };

    expect(formatSearchLeadLabel(search)).toBe("111 encontrados no Maps");
    expect(getSearchLeadSecondaryHint(search)).toBe("111 encontrados no Maps");
  });

  it("shows saved leads when search is completed", () => {
    const search = {
      status: "completed",
      leadCount: 12,
      totalFound: 12,
    };

    expect(formatSearchLeadLabel(search)).toBe("12 leads");
    expect(getSearchLeadSecondaryHint(search)).toBeNull();
  });
});
