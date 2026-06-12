import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button" />,
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: vi.fn(),
  }),
}));

import { AppShell } from "@/components/shell/app-shell";

describe("AppShell", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders children in the main content area", () => {
    render(
      <AppShell>
        <div>Conteúdo principal</div>
      </AppShell>,
    );

    const main = screen.getByRole("main");
    expect(main.textContent).toContain("Conteúdo principal");
  });
});
