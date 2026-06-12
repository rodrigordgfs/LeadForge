import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/providers/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("geist/font/sans", () => ({
  GeistSans: { variable: "--font-geist-sans" },
}));

vi.mock("geist/font/mono", () => ({
  GeistMono: { variable: "--font-geist-mono" },
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  afterEach(() => {
    cleanup();
  });

  it("applies Geist font variables and token-based body classes", () => {
    render(
      RootLayout({
        children: <div>App</div>,
      }),
    );

    const html = document.documentElement;
    expect(html.className).toContain("--font-geist-sans");
    expect(html.className).toContain("--font-geist-mono");

    const body = document.body;
    expect(body.className).toContain("bg-background");
    expect(body.className).not.toContain("bg-slate-50");
    expect(body.className).toContain("text-foreground");
    expect(body.className).toContain("font-sans");

    expect(screen.getByText("App")).toBeTruthy();
  });
});
