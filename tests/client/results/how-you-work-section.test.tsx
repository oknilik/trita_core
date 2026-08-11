/**
 * HowYouWorkSection client tests (Vitest + RTL) — motor-audit v4, FIX 3.
 *
 * A szekció NEVESÍTETT slotokból renderel (workstyle-content
 * howYouWorkParts): a „Figyelendő" kártya csak akkor jelenik meg, ha a
 * producer valódi risk-párt adott — a korábbi pozicionális megjelenítés a
 * második bekezdést vakon kockázatnak címkézte, akkor is, ha az egy pozitív
 * narratíva volt.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HowYouWorkSection } from "@/components/results/HowYouWorkSection";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

const MAIN = "Fő narratíva-bekezdés a működésedről.";
const SECOND_NARRATIVE = "Második, POZITÍV narratíva-bekezdés.";
const RISK = "Valódi kockázati összefoglaló. Mitigációs tanács hozzá.";

describe("HowYouWorkSection", () => {
  it("watch-slot nélkül NINCS Figyelendő kártya — a második narratíva kontextus", () => {
    render(
      <HowYouWorkSection
        parts={{ main: MAIN, watch: null, context: [SECOND_NARRATIVE] }}
        isUnlocked
      />,
    );

    expect(screen.getByText(MAIN)).toBeInTheDocument();
    // A pozitív bekezdés a Kontextus kártyában él, nem a borostyán
    // „Figyelendő" alatt.
    expect(screen.queryByText("Figyelendő")).toBeNull();
    expect(screen.getByText("Kontextus")).toBeInTheDocument();
    expect(screen.getByText(SECOND_NARRATIVE)).toBeInTheDocument();
  });

  it("valódi risk-párral a watch-slot a Figyelendő kártyába kerül", () => {
    render(
      <HowYouWorkSection
        parts={{ main: MAIN, watch: RISK, context: [] }}
        isUnlocked
      />,
    );

    expect(screen.getByText("Fő mintázat")).toBeInTheDocument();
    expect(screen.getByText(MAIN)).toBeInTheDocument();
    expect(screen.getByText("Figyelendő")).toBeInTheDocument();
    expect(screen.getByText(RISK)).toBeInTheDocument();
    // Üres kontextus → nincs Kontextus kártya.
    expect(screen.queryByText("Kontextus")).toBeNull();
  });

  it("üres main-nel (nincs tartalom) nem renderel semmit", () => {
    const { container } = render(
      <HowYouWorkSection parts={{ main: "", watch: null, context: [] }} isUnlocked />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("zárolt állapotban nem renderel", () => {
    const { container } = render(
      <HowYouWorkSection
        parts={{ main: MAIN, watch: RISK, context: [] }}
        isUnlocked={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
