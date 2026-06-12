import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setThemeMock = vi.fn();
const useThemeMock = vi.fn(() => ({
  theme: "dark",
  setTheme: setThemeMock,
}));

vi.mock("next-themes", () => ({
  useTheme: () => useThemeMock(),
}));

import { ThemeToggle } from "@/components/shell/theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useThemeMock.mockReturnValue({
      theme: "dark",
      setTheme: setThemeMock,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('calls setTheme with "light" when current theme is "dark"', async () => {
    render(<ThemeToggle />);

    fireEvent.click(await screen.findByRole("button", { name: "Alternar tema" }));
    expect(setThemeMock).toHaveBeenCalledWith("light");
  });

  it('calls setTheme with "dark" when current theme is "light"', async () => {
    useThemeMock.mockReturnValue({
      theme: "light",
      setTheme: setThemeMock,
    });

    render(<ThemeToggle />);
    fireEvent.click(await screen.findByRole("button", { name: "Alternar tema" }));
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });
});
