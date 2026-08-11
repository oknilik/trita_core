/**
 * ComparisonTab client tests (Vitest + RTL) — motor-audit v6, M1 + M5.
 *
 * Az önkép–külső kép dimenzió-kapu a kanonikus DIFF_MIN_GAP (= round(√2·SEM)
 * = 15): a korábbi hardkódolt 10 a 10–14 pontos gap-eket „eltérésnek" és
 * „vakfoltnak" osztályozta, miközben a dosszié/PDF ugyanarra 15-öt használt.
 * A ≥15-ös chip pedig a bronz magnitúdó-rámpán él (nem piros/error) — a nagy
 * eltérés „figyelemre érdemes vakfolt", nem hiba.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComparisonTab } from "@/components/results/ComparisonTab";
import { DIFF_MIN_GAP } from "@/lib/personality-type";
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

// Gap-ek: INTE 12 (a 10–14-es vitatott sáv), TEMP 16 (kapu felett, medium),
// ADAP 25 (kapu felett, large), a többi 0.
const DIMENSIONS: SerializedDimension[] = [
  dim("INTE", "Becsületesség-Alázat", 60, 72),
  dim("RESO", "Emocionalitás", 50, 50),
  dim("TEMP", "Extraverzió", 40, 56),
  dim("ADAP", "Barátságosság", 30, 55),
  dim("THOR", "Lelkiismeretesség", 55, 55),
  dim("OPEN", "Nyitottság", 65, 65),
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

describe("ComparisonTab — mérési-hiba kapu (DIFF_MIN_GAP)", () => {
  it("a kapu a kanonikus √2·SEM konstans, nem a régi 10-es literál", () => {
    expect(DIFF_MIN_GAP).toBe(15);
  });

  it("a 10–14 pontos gap egyezésnek számít, nem eltérésnek", () => {
    renderTab();
    // A 12 pontos INTE-gap chipje „egyezik" címkét kap…
    expect(screen.getByText("12 pont — egyezik")).toBeInTheDocument();
    // …és az INTE a „Nincs vakfolt" kártya felsorolásában áll.
    const noBlindspotList = screen.getByText(/Becsületesség-Alázat.*Emocionalitás/);
    expect(noBlindspotList).toBeInTheDocument();
  });

  it("a kapu feletti gap-ek eltérésként és vakfoltként jelennek meg", () => {
    renderTab();
    expect(screen.getByText("16 pont — eltérés")).toBeInTheDocument();
    expect(screen.getByText("25 pont — eltérés")).toBeInTheDocument();
    // Vakfolt-kártya csak a két kapu feletti dimenzióra van.
    expect(screen.getAllByText("Lehetséges vakfolt")).toHaveLength(2);
  });

  it("az összegzés a kapuval konzisztens: a 12-es gap nem szerepel eltérés-sorként", () => {
    renderTab();
    // 4 egyező dimenzió (0,0,0 + a 12-es) → „szinte azonos" összegző pont.
    expect(screen.getByText(/4 dimenzióban az önképed/)).toBeInTheDocument();
    // Eltérés-sor csak a 16-os és 25-ös gap-re.
    expect(screen.getByText(/\(16 pont eltérés\)/)).toBeInTheDocument();
    expect(screen.getByText(/\(25 pont eltérés\)/)).toBeInTheDocument();
    expect(screen.queryByText(/\(12 pont eltérés\)/)).toBeNull();
  });

  it("a nagy (≥15) gap chipje a bronz rámpán él, nem a piros error-tokeneken", () => {
    renderTab();
    const largeChip = screen.getByText("25 pont — eltérés");
    const style = largeChip.getAttribute("style") ?? "";
    expect(style).not.toContain("state-error");
    expect(style).toContain("surface-highlight-warm");
    const mediumChip = screen.getByText("16 pont — eltérés");
    expect(mediumChip.getAttribute("style") ?? "").not.toContain("state-error");
  });
});
