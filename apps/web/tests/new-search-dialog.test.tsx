import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { NewSearchDialog } from "@/components/search/new-search-dialog";

describe("NewSearchDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders search form inside dialog when open", async () => {
    render(<NewSearchDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByTestId("new-search-dialog")).toBeTruthy();
    expect(await screen.findByLabelText("Cidade")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Iniciar busca" })).toBeTruthy();
    });
  });
});
