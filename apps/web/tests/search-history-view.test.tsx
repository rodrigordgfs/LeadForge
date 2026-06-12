import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { SearchHistoryView } from "@/components/search/search-history-view";

describe("SearchHistoryView", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            searches: [
              {
                id: "job_1",
                segmentId: "saude",
                segmentName: "Saúde",
                subcategoryId: "dentista",
                subcategoryName: "Dentista",
                city: "Pelotas",
                state: "RS",
                radiusKm: 10,
                status: "completed",
                progressPct: 100,
                totalFound: 12,
                leadCount: 12,
                errorMessage: null,
                createdAt: "2026-06-11T12:00:00.000Z",
                completedAt: "2026-06-11T12:30:00.000Z",
              },
            ],
          }),
        ),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders search cards in a grid", async () => {
    render(<SearchHistoryView />);

    expect(await screen.findByTestId("search-history-grid")).toBeTruthy();
    expect(screen.getByTestId("search-card-job_1")).toBeTruthy();
    expect(screen.getByText("Pelotas/RS")).toBeTruthy();
    expect(screen.getByText("Saúde · Dentista")).toBeTruthy();
    expect(screen.getByText("Concluída")).toBeTruthy();
  });

  it("links each card to the search detail page", async () => {
    render(<SearchHistoryView />);

    const card = await screen.findByTestId("search-card-job_1");
    expect(card.getAttribute("href")).toBe("/busca/job_1");
  });

  it("shows empty state when there are no searches", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ searches: [] })),
    );

    render(<SearchHistoryView />);

    expect(await screen.findByTestId("search-history-empty")).toBeTruthy();
    expect(screen.getByText("Nenhuma busca realizada ainda.")).toBeTruthy();
  });

  it("shows Maps progress hint when search is running without saved leads", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          searches: [
            {
              id: "job_running",
              segmentId: "saude",
              segmentName: "Saúde",
              subcategoryId: null,
              subcategoryName: null,
              city: "Pelotas",
              state: "RS",
              radiusKm: 10,
              status: "running",
              progressPct: 23,
              totalFound: 111,
              leadCount: 0,
              errorMessage: null,
              createdAt: "2026-06-11T12:00:00.000Z",
              completedAt: null,
            },
          ],
        }),
      ),
    );

    render(<SearchHistoryView />);

    expect(await screen.findByText("111 encontrados no Maps")).toBeTruthy();
    expect(screen.getByText("0", { selector: "span.font-mono" })).toBeTruthy();
  });

  it("opens new search modal from header button", async () => {
    render(<SearchHistoryView />);

    await screen.findByTestId("search-history-grid");
    fireEvent.click(screen.getByTestId("open-new-search"));

    expect(screen.getByTestId("new-search-dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nova busca" })).toBeTruthy();
  });

  it("shows loading skeletons before data arrives", async () => {
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify({ searches: [] })),
              ),
            50,
          );
        }),
    );

    render(<SearchHistoryView />);

    expect(screen.getByTestId("search-history-loading")).toBeTruthy();

    await waitFor(() => {
      expect(screen.queryByTestId("search-history-loading")).toBeNull();
    });
  });
});
