/**
 * TypeGlyphPlate client tests (Vitest + RTL)
 *
 * Covers: a zárt/nyitott állapot, a helyes dimenzió-pár (a legerősebb adja a
 * formát, a második a motívumot), a névelős magyar magyarázat („a(z)”
 * sablon-műtermék nélkül), és az ábra szöveges leírása (a11y).
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TypeGlyphPlate } from "@/components/type/TypeGlyphPlate";

// Domináns: Nyitottság (O, szem) · második: Lelkiismeretesség (C, létrafokok)
const DIMENSIONS = [
  { code: "INTE", score: 55 },
  { code: "RESO", score: 50 },
  { code: "TEMP", score: 45 },
  { code: "ADAP", score: 30 },
  { code: "THOR", score: 74 },
  { code: "OPEN", score: 90 },
];

describe("TypeGlyphPlate", () => {
  it("zárva a típusnevet és a dimenzió-párt mutatja, a magyarázatot nem", () => {
    render(<TypeGlyphPlate dimensions={DIMENSIONS} locale="hu" />);

    const toggle = screen.getByRole("button", { expanded: false });
    expect(toggle).toHaveTextContent("Módszeres újító");
    expect(toggle).toHaveTextContent("Nyitottság × Lelkiismeretesség");
    expect(screen.queryByText(/A nagy forma a legerősebb dimenziód/)).toBeNull();
  });

  it("megnyitva a nyelvtant a helyes forma-motívum párral írja le", async () => {
    const user = userEvent.setup();
    render(<TypeGlyphPlate dimensions={DIMENSIONS} locale="hu" />);

    await user.click(screen.getByRole("button", { expanded: false }));

    const explanation = screen.getByText(/A nagy forma a legerősebb dimenziód/);
    // Névelő a hu-grammar.ts-ből; a sablonban nincs „a(z)” műtermék
    expect(explanation).toHaveTextContent("a Nyitottság: a szem");
    expect(explanation).toHaveTextContent("a Lelkiismeretesség: a létrafokok");
    expect(explanation.textContent).not.toContain("a(z)");
    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();
  });

  it("az ábrának szöveges leírása van (nem puszta dekoráció)", () => {
    render(<TypeGlyphPlate dimensions={DIMENSIONS} locale="hu" defaultOpen />);

    const glyphs = screen.getAllByRole("img", { name: /absztrakt típus-ábra/ });
    expect(glyphs.length).toBeGreaterThan(0);
    expect(glyphs[0]).toHaveAccessibleName(/szem alapforma \(O\) létrafokok motívummal \(C\)/);
  });

  it("heroTab módban a fül a kérdés-feliratot viseli, és nyitáskor kigördül a panel", async () => {
    const user = userEvent.setup();
    render(<TypeGlyphPlate dimensions={DIMENSIONS} locale="hu" mode="heroTab" />);

    const tab = screen.getByRole("button", { expanded: false });
    expect(tab).toHaveTextContent("Mit jelent a karakter-ábrám?");

    await user.click(tab);
    expect(screen.getByRole("button", { expanded: true })).toHaveTextContent(
      "Mit jelent a karakter-ábrám?",
    );
    expect(screen.getByText(/A nagy forma a legerősebb dimenziód/)).toBeInTheDocument();
  });

  it("két érvényes dimenzió alatt nem renderel semmit", () => {
    const { container } = render(
      <TypeGlyphPlate dimensions={[{ code: "OPEN", score: 90 }]} locale="hu" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  // S3-hedge (motor-audit v4, FIX 5): mérési hibán belüli top-2 sorrendnél
  // a felirat nem sugallhat sorrendet („X × Y"), a nyelvtan nem mondhat
  // „második legerősebb"-et — a pár rendezetlenül jelenik meg.
  it("bizonytalan top-párnál rendezetlen pár-felirat és hedge-elt nyelvtan", () => {
    // OPEN 78 vs THOR 74: a különbség (4) a mérési hibán belül (< 15).
    const uncertain = [
      { code: "INTE", score: 40 },
      { code: "RESO", score: 35 },
      { code: "TEMP", score: 30 },
      { code: "ADAP", score: 25 },
      { code: "THOR", score: 74 },
      { code: "OPEN", score: 78 },
    ];
    render(<TypeGlyphPlate dimensions={uncertain} locale="hu" defaultOpen />);

    // A címke főnév-only (a resolver ugyanazt a kaput futtatja).
    expect(screen.queryByText(/Módszeres újító/)).toBeNull();
    // Nincs sorrendet sugalló „×" pár-felirat…
    expect(screen.queryByText(/Nyitottság × Lelkiismeretesség/)).toBeNull();
    // …helyette rendezetlen felsorolás.
    expect(
      screen.getAllByText(/a két legerősebb: Nyitottság · Lelkiismeretesség/).length,
    ).toBeGreaterThan(0);
    // A nyelvtan nem állít „második legerősebb"-et, hanem a közel azonos
    // erősséget mondja ki.
    expect(screen.queryByText(/a második legerősebb/)).toBeNull();
    expect(
      screen.getByText(/A két legerősebb dimenziód — a Nyitottság és a Lelkiismeretesség/),
    ).toBeInTheDocument();
    // Mérési-hiba SZÁM nem jelenik meg a hedge-szövegben sem.
    expect(document.body.textContent).not.toContain("±");
  });

  it("határozott sorrendnél változatlan a „×” felirat és a sima nyelvtan", () => {
    render(<TypeGlyphPlate dimensions={DIMENSIONS} locale="hu" defaultOpen />);
    expect(screen.getAllByText(/Nyitottság × Lelkiismeretesség/).length).toBeGreaterThan(0);
    expect(screen.getByText(/a második legerősebb/)).toBeInTheDocument();
  });
});
