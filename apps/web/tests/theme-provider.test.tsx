import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-themes", () => ({
  ThemeProvider: ({
    children,
    defaultTheme,
    enableSystem,
    attribute,
    storageKey,
  }: {
    children: React.ReactNode;
    defaultTheme?: string;
    enableSystem?: boolean;
    attribute?: string;
    storageKey?: string;
  }) => (
    <div
      data-testid="next-themes-provider"
      data-default-theme={defaultTheme}
      data-enable-system={String(enableSystem)}
      data-attribute={attribute}
      data-storage-key={storageKey}
    >
      {children}
    </div>
  ),
}));

import { ThemeProvider } from "@/components/providers/theme-provider";

describe("ThemeProvider", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders children without error", () => {
    render(
      <ThemeProvider>
        <span>Conteúdo</span>
      </ThemeProvider>,
    );

    expect(screen.getByText("Conteúdo")).toBeTruthy();
  });

  it("uses dark default and disables system theme", () => {
    render(
      <ThemeProvider>
        <span>Tema</span>
      </ThemeProvider>,
    );

    const provider = screen.getByTestId("next-themes-provider");
    expect(provider.getAttribute("data-default-theme")).toBe("dark");
    expect(provider.getAttribute("data-enable-system")).toBe("false");
    expect(provider.getAttribute("data-attribute")).toBe("class");
    expect(provider.getAttribute("data-storage-key")).toBe("leadforge-theme");
  });
});
