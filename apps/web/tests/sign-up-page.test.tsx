import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  SignUp: ({ appearance }: { appearance?: unknown }) => (
    <div data-testid="sign-up" data-appearance={JSON.stringify(appearance)} />
  ),
}));

import SignUpPage from "@/app/(auth)/sign-up/[[...sign-up]]/page";

describe("SignUpPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders SignUp with appearance prop", () => {
    render(<SignUpPage />);

    const signUp = screen.getByTestId("sign-up");
    expect(signUp).toBeTruthy();
    expect(signUp.getAttribute("data-appearance")).toContain("--font-geist-sans");
  });
});
