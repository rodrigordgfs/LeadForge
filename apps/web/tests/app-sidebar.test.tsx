import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const pathnameMock = vi.fn(() => "/dashboard");

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

import { AppSidebar, navItems } from "@/components/shell/app-sidebar";

describe("AppSidebar", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders four nav links with correct hrefs", () => {
    render(<AppSidebar />);

    for (const item of navItems) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link.getAttribute("href")).toBe(item.href);
    }
  });

  it("marks the current pathname link as active", () => {
    pathnameMock.mockReturnValue("/crm");
    render(<AppSidebar />);

    const activeLink = screen.getByRole("link", { name: "CRM" });
    expect(activeLink.getAttribute("aria-current")).toBe("page");
    expect(activeLink.className).toContain("bg-accent");

    const inactiveLink = screen.getByRole("link", { name: "Dashboard" });
    expect(activeLink.getAttribute("aria-current")).toBe("page");
    expect(inactiveLink.getAttribute("aria-current")).toBeNull();
  });
});
