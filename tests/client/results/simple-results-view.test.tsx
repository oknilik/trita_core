/**
 * Egyszerű eredmény-nézet (Vitest + RTL)
 *
 * A nézet két ígérete kódban is ellenőrizhető:
 *  1. alapból NINCS pontszám a képernyőn (a szám olyan pontosságot ígér,
 *     amivel egy önjellemzés nem rendelkezik) — a „Számok" kapcsoló hozza elő;
 *  2. a részletes nézetre és a külső képre vezető kilépési pont mindig ott van
 *     (az egyszerű nézetben nincs fülsáv, ezek helyettesítik).
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SimpleResultsView } from "@/components/results/simple/SimpleResultsView";
import { ViewModeSwitch } from "@/components/results/simple/ViewModeSwitch";
import { buildSimpleSummary } from "@/lib/results/simple-summary";
import { TRITAN_DIMENSIONS, TRITAN_ORDER } from "@/lib/tritan";
import { t } from "@/lib/i18n";

const SCORES: Record<string, number> = {
  INTE: 74,
  RESO: 38,
  TEMP: 81,
  ADAP: 55,
  THOR: 46,
  OPEN: 78,
};

const summary = buildSimpleSummary({
  dimensions: TRITAN_ORDER.map((code) => ({
    code,
    label: TRITAN_DIMENSIONS[code].hu,
    score: SCORES[code],
  })),
  locale: "hu",
});

function renderView(showNumbers = false) {
  const onOpenFull = vi.fn();
  const onOpenComparison = vi.fn();
  render(
    <SimpleResultsView
      summary={summary}
      showNumbers={showNumbers}
      locale="hu"
      onOpenFull={onOpenFull}
      onOpenComparison={onOpenComparison}
    />,
  );
  return { onOpenFull, onOpenComparison };
}

describe("SimpleResultsView", () => {
  it("mind a hat dimenziót kétpólusú skálán mutatja, pontszám nélkül", () => {
    renderView();

    for (const code of TRITAN_ORDER) {
      // A címke a skála-soron kívül forrás-chipként is megjelenhet.
      expect(screen.getAllByText(TRITAN_DIMENSIONS[code].hu).length).toBeGreaterThan(0);
    }
    // A pontszámok egyike sem jelenhet meg alapállapotban.
    for (const score of Object.values(SCORES)) {
      expect(screen.queryByText(String(score))).toBeNull();
    }
  });

  it("bekapcsolt Számok-kapcsolóval megjelennek a pontszámok", () => {
    renderView(true);

    for (const score of Object.values(SCORES)) {
      expect(screen.getByText(String(score))).toBeTruthy();
    }
  });

  it("három állítás jelenik meg, mindegyik forrás-dimenzióval", () => {
    renderView();

    expect(screen.getByText(t("results.simpleStatementStrength", "hu"))).toBeTruthy();
    expect(screen.getByText(t("results.simpleStatementPattern", "hu"))).toBeTruthy();
    expect(screen.getByText(t("results.simpleStatementWatch", "hu"))).toBeTruthy();
    expect(screen.getAllByText(t("results.simpleStatementSource", "hu")).length).toBe(3);
  });

  it("a részletes nézet és a külső kép is elérhető innen", () => {
    const { onOpenFull, onOpenComparison } = renderView();

    fireEvent.click(screen.getByRole("button", { name: /Részletes nézet/ }));
    expect(onOpenFull).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: /Külső kép/ }));
    expect(onOpenComparison).toHaveBeenCalledOnce();
  });

  it("módszertani jegyzet: önjellemzés, nem diagnózis", () => {
    renderView();
    expect(screen.getByText(new RegExp(t("results.simpleMethodTitle", "hu")))).toBeTruthy();
  });
});

describe("ViewModeSwitch", () => {
  it("a részletes nézet választásakor a hívót értesíti", () => {
    const onChange = vi.fn();
    render(<ViewModeSwitch mode="simple" onChange={onChange} locale="hu" />);

    fireEvent.click(screen.getByRole("button", { name: t("results.viewModeFull", "hu") }));
    expect(onChange).toHaveBeenCalledWith("full");
  });

  it("a Számok-kapcsoló csak akkor jelenik meg, ha van kezelője", () => {
    const { rerender } = render(
      <ViewModeSwitch mode="simple" onChange={vi.fn()} locale="hu" />,
    );
    expect(screen.queryByRole("switch")).toBeNull();

    rerender(
      <ViewModeSwitch
        mode="simple"
        onChange={vi.fn()}
        showNumbers={false}
        onToggleNumbers={vi.fn()}
        locale="hu"
      />,
    );
    const toggle = screen.getByRole("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });
});
