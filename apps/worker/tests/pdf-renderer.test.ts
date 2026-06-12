import { describe, expect, it } from "vitest";
import {
  registerGeistFonts,
  resolveGeistFontDirs,
} from "../src/artifacts/pdf/fonts.js";
import {
  renderDiagnosisPdf,
  renderProposalPdf,
  renderWireframePdf,
} from "../src/artifacts/pdf-renderer.js";
import { geistTokens, pdfStyles } from "../src/artifacts/pdf/styles.js";

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

describe("pdf fonts", () => {
  it("resolves geist package font directories", () => {
    const dirs = resolveGeistFontDirs();

    expect(dirs.sansDir).toContain("geist-sans");
    expect(dirs.monoDir).toContain("geist-mono");
  });

  it("registerGeistFonts completes without throwing when geist fonts exist", () => {
    expect(() => registerGeistFonts()).not.toThrow();
  });
});

describe("pdf styles", () => {
  it("uses geistTokens.dark.foreground instead of hardcoded subtitle gray", () => {
    expect(pdfStyles.subtitle.color).toBe(geistTokens.dark.mutedForeground);
    expect(pdfStyles.subtitle.color).not.toBe("#444444");
    expect(pdfStyles.page.color).toBe(geistTokens.dark.foreground);
    expect(pdfStyles.page.fontFamily).toBe("Geist Sans");
  });
});

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
