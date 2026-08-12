/**
 * DimensionAccordion client tests (Vitest + RTL) — motor-audit v4.
 *
 * FIX 1 (termékdöntés, 2026-08-11): mérési-hiba SZÁM (±SEM) sehol nem
 * jelenhet meg — az akkordeon fejlécében nincs ±-chip, a törzsben nincs
 * mérési-hiba jegyzet.
 * FIX 4: örökség-sor (nincs facet-adat) esetén a részletes bontás szekció
 * el sem készül — koholt 0-facet sáv nem renderelődik.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DimensionAccordion } from "@/components/results/DimensionAccordion";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

const DIM_WITH_FACETS = {
  code: "O",
  name: "Nyitottság",
  value: 82,
  description: "Munkahelyi leírás.",
  insight: "Személyes insight.",
  facets: [
    { code: "creativity", label: "Kreativitás", score: 88 },
    { code: "inquisitiveness", label: "Kíváncsiság", score: 76 },
  ],
};

const LEGACY_DIM = {
  code: "C",
  name: "Lelkiismeretesség",
  value: 61,
  description: "Munkahelyi leírás.",
  insight: "Személyes insight.",
  facets: [],
};

describe("DimensionAccordion", () => {
  it("nem jelenít meg ± mérési-hiba számot sem a fejlécben, sem a törzsben", () => {
    render(
      <DimensionAccordion dimensions={[DIM_WITH_FACETS]} defaultOpenIdx={0} />,
    );

    expect(screen.getByText("82 / 100")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("±");
    expect(document.body.textContent).not.toContain("mérési hib");
  });

  it("mért facetekkel a részletes bontás renderel", () => {
    render(
      <DimensionAccordion dimensions={[DIM_WITH_FACETS]} defaultOpenIdx={0} />,
    );

    expect(screen.getByText("Részletes bontás")).toBeInTheDocument();
    expect(screen.getByText("Kreativitás")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
  });

  it("örökség-sor (üres facets): nincs facet-szekció, nincs 0-s sáv", () => {
    render(<DimensionAccordion dimensions={[LEGACY_DIM]} defaultOpenIdx={0} />);

    expect(screen.getByText("Személyes insight.")).toBeInTheDocument();
    expect(screen.queryByText("Részletes bontás")).toBeNull();
    // Egyetlen 0-értékű facet-szám sem jelenik meg.
    expect(screen.queryByText(/^0$/)).toBeNull();
  });
});
