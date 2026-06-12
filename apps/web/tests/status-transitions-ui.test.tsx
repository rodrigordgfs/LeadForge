import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KanbanBoard } from "@/components/crm/kanban-board";
import { SettingsView } from "@/components/settings/settings-view";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/constants/labels";

describe("KanbanBoard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders 7 columns with correct PRD status labels", () => {
    const grouped = Object.fromEntries(
      LEAD_STATUS_ORDER.map((status) => [status, []]),
    ) as Record<(typeof LEAD_STATUS_ORDER)[number], []>;

    render(
      <KanbanBoard leadsByStatus={grouped} onStatusChange={vi.fn()} />,
    );

    for (const status of LEAD_STATUS_ORDER) {
      expect(screen.getByText(LEAD_STATUS_LABELS[status])).toBeTruthy();
      expect(screen.getByTestId(`kanban-column-${status}`)).toBeTruthy();
    }

    expect(screen.getByTestId("kanban-board")).toBeTruthy();
  });

  it("calls onStatusChange when lead dropped on em_contato column", async () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);

    render(
      <KanbanBoard
        leadsByStatus={{
          novo: [
            {
              id: "lead_1",
              name: "Clínica ABC",
              city: "Pelotas",
              score: 30,
              scoreBand: "critical",
              status: "novo",
            },
          ],
          em_contato: [],
          interessado: [],
          proposta_enviada: [],
          negociacao: [],
          fechado: [],
          perdido: [],
        }}
        onStatusChange={onStatusChange}
      />,
    );

    const card = screen.getByTestId("kanban-card-lead_1");
    const targetColumn = screen.getByTestId("kanban-column-em_contato");

    fireEvent.dragStart(card);
    fireEvent.dragOver(targetColumn);
    fireEvent.drop(targetColumn);

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith("lead_1", "em_contato");
    });
  });

  it("renders lead card with score badge", () => {
    render(
      <KanbanBoard
        leadsByStatus={{
          novo: [
            {
              id: "lead_1",
              name: "Clínica ABC",
              city: "Pelotas",
              score: 30,
              scoreBand: "critical",
              status: "novo",
            },
          ],
          em_contato: [],
          interessado: [],
          proposta_enviada: [],
          negociacao: [],
          fechado: [],
          perdido: [],
        }}
        onStatusChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("kanban-card-lead_1")).toBeTruthy();
    expect(screen.getByTestId("score-badge")).toBeTruthy();
  });
});

describe("SettingsView", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            highOpportunityThreshold: 60,
            proposalDefaults: {},
          }),
        ),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows threshold slider default value 60 on first load", async () => {
    render(<SettingsView />);

    const slider = await screen.findByTestId("threshold-slider");
    expect((slider as HTMLInputElement).value).toBe("60");
  });

  it("renders scope, deadline, and monthly fee inputs after load", async () => {
    render(<SettingsView />);

    expect(await screen.findByLabelText("Escopo padrão")).toBeTruthy();
    expect(screen.getByLabelText("Prazo padrão")).toBeTruthy();
    expect(screen.getByLabelText("Mensalidade padrão (R$)")).toBeTruthy();
  });

  it("calls PATCH /api/settings with new threshold on save", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            highOpportunityThreshold: 60,
            proposalDefaults: {},
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            highOpportunityThreshold: 55,
            proposalDefaults: {},
          }),
        ),
      );

    render(<SettingsView />);

    const slider = await screen.findByTestId("threshold-slider");
    fireEvent.change(slider, { target: { value: "55" } });
    fireEvent.click(screen.getByTestId("settings-save"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({
          method: "PATCH",
        }),
      );
    });

    const patchCall = vi
      .mocked(fetch)
      .mock.calls.find((call) => call[1]?.method === "PATCH");
    const body = JSON.parse(String(patchCall?.[1]?.body));

    expect(body.highOpportunityThreshold).toBe(55);
  });
});

describe("validateStatusTransition", () => {
  it("rejects Novo to Fechado transition", async () => {
    const { validateStatusTransition } = await import(
      "@/lib/crm/status-transitions"
    );

    expect(validateStatusTransition("novo", "fechado")).toContain("inválida");
  });
});
