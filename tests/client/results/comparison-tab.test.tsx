/**
 * ComparisonTab client tests (Vitest + RTL) — motor-audit v6, M1 + M5.
 *
 * Az önkép–külső kép dimenzió-kapu a kanonikus DIFF_MIN_GAP (= round(√2·SEM)):
 * a korábbi hardkódolt 10 a kapu alatti gap-eket „eltérésnek" és „vakfoltnak"
 * osztályozta, miközben a dosszié/PDF ugyanarra a kanonikus küszöböt
 * használta. A kapu FELETTI chip pedig a bronz magnitúdó-rámpán él (nem
 * piros/error) — a nagy eltérés „figyelemre érdemes vakfolt", nem hiba.
 *
 * A küszöb SZÁMÉRTÉKE a kérdésbankból (rövid forma item-száma) és a mért
 * reliabilitás-konstansokból jön, ezért itt nem literálhoz kötjük — a
 * számszerű invariáns helye: tests/unit/scoring/psychometrics.test.ts.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComparisonTab } from "@/components/results/ComparisonTab";
import { DIFF_MIN_GAP } from "@/lib/personality-type";
import { diffStandardError } from "@/lib/psychometrics";
import type { SerializedDimension } from "@/components/profile/ProfileTabs";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

function dim(
  code: string,
  label: string,
  score: number,
  observerScore: number,
): SerializedDimension {
  return {
    code,
    label,
    color: "#3d6b5e",
    score,
    insight: "",
    description: "",
    insights: { low: "", mid: "", high: "" },
    observerScore,
    facets: [],
  };
}

// Gap-ek: H 10 (a kapu alatti, vitatott sáv), X 16 (kapu felett, medium),
// A 25 (kapu felett, large), a többi 0.
//
// Miért PONT 10 a vitatott gap (2026-08-11, mért SEM-konstansok): a kapu
// 14 → 11 lett, tehát a régi 12-es fixture már a kapu FÖLÉ került. A 10 az
// egyetlen érték, ami a kanonikus kapu alatt van, de a régi hardkódolt
// 10-es literál szerint még „eltérés" lenne (>= 10) — így a teszt továbbra
// is pontosan azt fogja meg, amiért készült: a literál visszaszivárgását.
const DIMENSIONS: SerializedDimension[] = [
  dim("H", "Becsületesség-Alázat", 60, 70),
  dim("E", "Emocionalitás", 50, 50),
  dim("X", "Extraverzió", 40, 56),
  dim("A", "Barátságosság", 30, 55),
  dim("C", "Lelkiismeretesség", 55, 55),
  dim("O", "Nyitottság", 65, 65),
];

function renderTab() {
  return render(
    <ComparisonTab
      dimensions={DIMENSIONS}
      hasObserverData
      observerCount={3}
    />,
  );
}

describe("ComparisonTab – mérési-hiba kapu (DIFF_MIN_GAP)", () => {
  it("az új observer-fejléc mobilon egymás alá, asztalon két oszlopba rendeződik", () => {
    renderTab();
    expect(screen.getByTestId("observer-comparison-surface")).toBeInTheDocument();
    expect(screen.getByTestId("observer-comparison-hero")).toHaveClass(
      "lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]",
    );
    expect(screen.getByRole("heading", { name: /Hogyan látnak mások/i })).toBeInTheDocument();
  });

  it("a kapu a kanonikus √2·SEM konstans, nem a régi 10-es literál", () => {
    expect(DIFF_MIN_GAP).toBe(Math.round(diffStandardError("short")));
    expect(DIFF_MIN_GAP).toBeGreaterThan(10);
  });

  it("a kapu alatti (10 pontos) gap egyezésnek számít, nem eltérésnek", () => {
    renderTab();
    // A 10 pontos H-gap chipje „egyezik" címkét kap…
    expect(screen.getByText("10 pont – egyezik")).toBeInTheDocument();
    // …és az H a „Nincs vakfolt" kártya felsorolásában áll.
    const noBlindspotList = screen.getByText(/Becsületesség-Alázat.*Emocionalitás/);
    expect(noBlindspotList).toBeInTheDocument();
  });

  it("a kapu feletti gap-ek eltérésként és vakfoltként jelennek meg", () => {
    renderTab();
    expect(screen.getByText("16 pont – eltérés")).toBeInTheDocument();
    expect(screen.getByText("25 pont – eltérés")).toBeInTheDocument();
    // Vakfolt-kártya csak a két kapu feletti dimenzióra van.
    expect(screen.getAllByText("Lehetséges vakfolt")).toHaveLength(2);
  });

  it("az összegzés a kapuval konzisztens: a 10-es gap nem szerepel eltérés-sorként", () => {
    renderTab();
    // 4 egyező dimenzió (0,0,0 + a 10-es) → „szinte azonos" összegző pont.
    expect(screen.getByText(/4 dimenzióban az önképed/)).toBeInTheDocument();
    // Eltérés-sor csak a 16-os és 25-ös gap-re.
    expect(screen.getByText(/\(16 pont eltérés\)/)).toBeInTheDocument();
    expect(screen.getByText(/\(25 pont eltérés\)/)).toBeInTheDocument();
    expect(screen.queryByText(/\(10 pont eltérés\)/)).toBeNull();
  });

  it("a nagy (≥15) gap chipje a bronz rámpán él, nem a piros error-tokeneken", () => {
    renderTab();
    const largeChip = screen.getByText("25 pont – eltérés");
    const style = largeChip.getAttribute("style") ?? "";
    expect(style).not.toContain("state-error");
    expect(style).toContain("surface-highlight-warm");
    const mediumChip = screen.getByText("16 pont – eltérés");
    expect(mediumChip.getAttribute("style") ?? "").not.toContain("state-error");
  });
});
