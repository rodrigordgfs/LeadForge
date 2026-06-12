import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  SignIn: ({ appearance }: { appearance?: unknown }) => (
    <div data-testid="sign-in" data-appearance={JSON.stringify(appearance)} />
  ),
}));

import SignInPage from "@/app/(auth)/sign-in/[[...sign-in]]/page";
import { clerkAppearance } from "@/lib/clerk-appearance";

describe("SignInPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders SignIn with appearance prop", () => {
    render(<SignInPage />);

    const signIn = screen.getByTestId("sign-in");
    expect(signIn).toBeTruthy();
    expect(signIn.getAttribute("data-appearance")).toContain("--font-geist-sans");
    expect(signIn.getAttribute("data-appearance")).toContain(
      clerkAppearance.variables?.colorBackground ?? "",
    );
  });
});
