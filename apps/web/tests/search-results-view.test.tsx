import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/use-job-events", () => ({
  useJobEvents: () => ({
    progressPct: 100,
    totalFound: 0,
    phase: "completed",
    status: "completed",
    reset: vi.fn(),
  }),
}));

import { SearchResultsView } from "@/components/search/search-results-view";

describe("SearchResultsView", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes("/leads")) {
          return Promise.resolve(
            new Response(JSON.stringify({ leads: [], total: 0 })),
          );
        }

        if (url === "/api/searches/job_1" && options?.method === "DELETE") {
          return Promise.resolve(new Response(null, { status: 204 }));
        }

        if (url === "/api/searches/job_1") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                status: "completed",
                progressPct: 100,
                totalFound: 0,
              }),
            ),
          );
        }

        return Promise.resolve(new Response(null, { status: 404 }));
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("deletes the search and redirects to /buscas", async () => {
    render(<SearchResultsView searchId="job_1" />);

    const deleteButton = await screen.findByTestId("delete-search-button");
    expect(deleteButton.hasAttribute("disabled")).toBe(false);
    fireEvent.click(deleteButton);
    expect(screen.getByTestId("delete-confirm-dialog")).toBeTruthy();
    expect(screen.getByText("Excluir busca?")).toBeTruthy();
    fireEvent.click(screen.getByTestId("confirm-delete-search"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/searches/job_1", {
        method: "DELETE",
      });
      expect(pushMock).toHaveBeenCalledWith("/buscas");
    });
  });
});
