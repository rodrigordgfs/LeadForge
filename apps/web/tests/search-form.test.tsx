import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { SearchForm } from "@/components/search/search-form";
import { getAllSegments } from "@leadforge/shared";

describe("SearchForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders segment, state, city, and radius fields with accessible labels", () => {
    render(<SearchForm />);

    expect(screen.getByLabelText("Segmento")).toBeTruthy();
    expect(screen.getByLabelText("Estado")).toBeTruthy();
    expect(screen.getByLabelText("Cidade")).toBeTruthy();
    expect(screen.getByLabelText(/Raio \(km\)/i)).toBeTruthy();
    expect(screen.getByTestId("segment-select")).toBeTruthy();
    expect(screen.getByTestId("city-input")).toBeTruthy();
  });

  it("shows first segment as default selection", () => {
    render(<SearchForm />);

    const firstSegment = getAllSegments()[0];
    expect(screen.getByTestId("segment-select").textContent).toContain(
      firstSegment?.name ?? "",
    );
  });

  it("updates subcategory options when parent segment changes", async () => {
    render(<SearchForm />);

    fireEvent.click(screen.getByTestId("segment-select"));
    fireEvent.click(await screen.findByRole("option", { name: "Alimentação" }));

    fireEvent.click(screen.getByTestId("subcategory-select"));
    expect(await screen.findByRole("option", { name: "Restaurante" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Clínica Médica" })).toBeNull();
  });

  it("prevents submit with empty cidade field", async () => {
    render(<SearchForm />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar busca" }));

    expect(await screen.findByText("Informe a cidade")).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("calls POST /api/searches with correct payload shape", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ searchJobId: "job_123" }), {
        status: 201,
      }),
    );

    render(<SearchForm />);

    fireEvent.change(screen.getByTestId("city-input"), {
      target: { value: "Pelotas" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Iniciar busca" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/searches",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    const [, requestInit] = vi.mocked(fetch).mock.calls[0] ?? [];
    const body = JSON.parse(String(requestInit?.body));

    expect(body).toMatchObject({
      segmentId: expect.any(String),
      state: expect.any(String),
      city: "Pelotas",
      radiusKm: expect.any(Number),
    });

    expect(pushMock).toHaveBeenCalledWith("/busca/job_123");
  });
});
