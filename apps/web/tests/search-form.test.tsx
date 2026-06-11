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

  it("renders all segments in select dropdown", () => {
    render(<SearchForm />);

    const segmentSelect = screen.getByTestId("segment-select");
    const options = segmentSelect.querySelectorAll("option");

    expect(options).toHaveLength(getAllSegments().length);
  });

  it("updates subcategory select when parent segment changes", () => {
    render(<SearchForm />);

    fireEvent.change(screen.getByTestId("segment-select"), {
      target: { value: "alimentacao" },
    });

    const subcategorySelect = screen.getByTestId("subcategory-select");
    const labels = Array.from(subcategorySelect.querySelectorAll("option")).map(
      (option) => option.textContent,
    );

    expect(labels).toContain("Restaurante");
    expect(labels).not.toContain("Clínica Médica");
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
