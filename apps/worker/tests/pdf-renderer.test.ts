import { describe, expect, it } from "vitest";
import {
  renderDiagnosisPdf,
  renderProposalPdf,
  renderWireframePdf,
} from "../src/artifacts/pdf-renderer.js";

const proposal = {
  scope: "Site institucional + SEO local",
  value: 4500,
  deadline: "30 dias",
  monthlyFee: 350,
  observations: "Inclui manutenção mensal básica",
};

const diagnosis = {
  narrative:
    "A empresa apresenta baixa maturidade digital. Recomenda-se site institucional e SEO local.",
};

const wireframe = {
  pages: [
    {
      name: "Home",
      sections: [
        {
          name: "Hero",
          suggestedComponents: ["Título", "CTA", "Imagem"],
        },
      ],
    },
  ],
};

describe("pdf renderer", () => {
  it("produces non-empty proposal PDF buffer for fixture data", async () => {
    const buffer = await renderProposalPdf("Auto Center Silva", proposal);

    expect(buffer.byteLength).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });

  it("produces non-empty diagnosis PDF buffer for fixture data", async () => {
    const buffer = await renderDiagnosisPdf("Auto Center Silva", diagnosis);

    expect(buffer.byteLength).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });

  it("produces non-empty wireframe PDF buffer for fixture data", async () => {
    const buffer = await renderWireframePdf("Auto Center Silva", wireframe);

    expect(buffer.byteLength).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });
});
