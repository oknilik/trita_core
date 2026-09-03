import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeamReportFigure } from "@/components/blog/TeamReportFigure";

function renderFigure(
  dimensions: { code: string; label: string; average: number; spread: number }[],
) {
  return render(
    <TeamReportFigure
      locale="hu"
      dimensions={dimensions}
    />,
  );
}

describe("TeamReportFigure", () => {
  it("csak aggregált csapatátlagot és belső sokféleséget rajzol ki", () => {
    renderFigure([
      { code: "H", label: "Becsületesség-Alázat", average: 62, spread: 20 },
      { code: "C", label: "Lelkiismeretesség", average: 69, spread: 8 },
    ]);

    expect(screen.getByText("Aggregált csapatprofil")).toBeInTheDocument();
    expect(screen.getByText("Becsületesség-Alázat")).toBeInTheDocument();
    expect(screen.getByText("Lelkiismeretesség")).toBeInTheDocument();
    expect(screen.getAllByText(/Csapatátlag:/)).toHaveLength(2);
    expect(screen.getByText(/egyéni eredmények nélkül/)).toBeInTheDocument();
    expect(screen.getByText(/más csapattag egyéni értéke nem látható/)).toBeInTheDocument();
  });

  it("nem jelenít meg személyneveket", () => {
    renderFigure([{ code: "X", label: "Extraverzió", average: 55, spread: 19 }]);

    expect(screen.queryByText("Anna")).not.toBeInTheDocument();
    expect(screen.queryByText("Bence")).not.toBeInTheDocument();
  });
});

describe("TeamReportFigure variánsok", () => {
  it("a referencia-variáns más adatsort és más képaláírást ad, mint az esettanulmányé", () => {
    const { container: caseFig } = render(<TeamReportFigure locale="hu" />);
    const caseText = caseFig.textContent ?? "";
    cleanup();
    const { container: refFig } = render(<TeamReportFigure locale="hu" variant="reference" />);
    const refText = refFig.textContent ?? "";

    // A történet képaláírása valós, módosított csapatadatra hivatkozik –
    // ez az állítás sérülne, ha a referenciacikk ugyanazt mutatná.
    expect(caseText).not.toEqual(refText);
    expect(refText).toContain("nem valós csapat adata");
    expect(caseText).not.toContain("nem valós csapat adata");
  });

  it("a referencia-variáns egy szűk és egy széles sávot állít szembe", () => {
    render(<TeamReportFigure locale="hu" variant="reference" />);
    expect(screen.getByLabelText(/Barátságosság.*szűk/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lelkiismeretesség.*széles/)).toBeInTheDocument();
  });
});
