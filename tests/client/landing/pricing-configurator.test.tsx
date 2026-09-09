import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamPricingConfigurator } from "@/components/pricing/TeamPricingConfigurator";
import { DEFAULT_RATE_CARD } from "@/lib/quote/rate-card";
import { formatMoney } from "@/lib/pricing/fx";
import { derivePublicLadder, ladderPrice } from "@/lib/pricing/team-ladder";

const track = vi.fn();
vi.mock("@/lib/analytics/client", () => ({
  track: (...args: unknown[]) => track(...args),
}));

const ladder = derivePublicLadder(DEFAULT_RATE_CARD);
// A hu-HU ezres tagoló nem törő szóköz; a DOM-szöveg normalizálva sima
// szóközzel jön vissza, ezért az elvárt szöveget is arra hozzuk.
const plain = (value: string) => value.replace(/\u00a0/g, " ");

/**
 * Az /pricing árblokk: a látogató a két szint és a létszám alapján
 * ugyanazt a számot látja, amit az admin kalkulátor az ajánlatba tesz.
 */
describe("TeamPricingConfigurator", () => {
  it("a Csapatkép szinttel és 10 fővel nyit, a hirdetett fejenkénti árral", () => {
    render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);

    const kep = screen.getByRole("button", { name: /^Csapatkép/ });
    expect(kep).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("slider")).toHaveValue("10");
    expect(
      screen.getByText(plain(`Összesen ${formatMoney(ladderPrice(ladder, "kep", 10).total, "hu", ladder.fx)} + ÁFA a teljes létszámra`)),
    ).toBeInTheDocument();
  });

  it("a Csapatprogramra váltva az ár és a tartalom-lista frissül", () => {
    render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);

    fireEvent.click(screen.getByRole("button", { name: /Csapatprogram/ }));

    expect(screen.getByRole("button", { name: /Csapatprogram/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: /Mit tartalmaz a Csapatprogram\?/ })).toBeInTheDocument();
    expect(
      screen.getByText(plain(`Összesen ${formatMoney(ladderPrice(ladder, "prog", 10).total, "hu", ladder.fx)} + ÁFA a teljes létszámra`)),
    ).toBeInTheDocument();
  });

  it("a sávhatár felett a fejenkénti átlag csökken, és a bontás mutatja a további főket", () => {
    render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);

    fireEvent.change(screen.getByRole("slider"), { target: { value: "20" } });

    const price = ladderPrice(ladder, "kep", 20);
    expect(price.perHeadAverage).toBeLessThan(ladder.tiers.kep.perHead);
    expect(screen.getByText("További résztvevők")).toBeInTheDocument();
    expect(
      screen.getByText(plain(`${price.overHeads} × ${formatMoney(ladder.tiers.kep.perHeadOver, "hu", ladder.fx)}`)),
    ).toBeInTheDocument();
  });

  it("a sáv felett a nagy szám átlagár, és a csapatok száma nem korlát", () => {
    render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);

    expect(screen.getByText("Egy főre jutó ár")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "35" } });
    expect(screen.getByText("Egy főre jutó átlagár")).toBeInTheDocument();
    expect(screen.getByText(/A résztvevők több csapatból is érkezhetnek/)).toBeInTheDocument();
    expect(screen.getByText(/A 11\. résztvevőtől minden további fő díja/)).toBeInTheDocument();
    expect(
      screen.getByText(plain(`Összesen ${formatMoney(ladderPrice(ladder, "kep", 35).total, "hu", ladder.fx)} + ÁFA a teljes létszámra`)),
    ).toBeInTheDocument();
  });

  it("a pilotkedvezmény csak a Csapatprogramnál hivatkozik a fenti díjra", () => {
    render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);

    // Csapatkép a nyitóállapot: a „fenti díj" ilyenkor a Csapatkép ára.
    expect(screen.getByText(/A pilotkedvezmény a Csapatprogramra érvényes/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Csapatprogram/ }));
    expect(screen.getByText(/a Csapatprogram fenti díjából/)).toBeInTheDocument();
  });

  it("angolul euróban mutat, a létra árfolyamán váltva, plusz VAT-tal", () => {
    // 400 Ft/€ tartalék-árfolyam: 35 000 Ft → €88, 10 fő → €875.
    render(<TeamPricingConfigurator ladder={ladder} locale="en" />);

    expect(screen.getByText("€88")).toBeInTheDocument();
    expect(screen.getByText("/ person + VAT")).toBeInTheDocument();
    expect(screen.getByText("€875 + VAT in total for everyone taking part")).toBeInTheDocument();
    expect(screen.queryByText(/Ft/)).not.toBeInTheDocument();
  });

  it("a csúszka végén (40+) szám helyett egyedi ajánlatot kínál", () => {
    render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);

    fireEvent.change(screen.getByRole("slider"), { target: { value: "41" } });

    expect(screen.getByText("Egyedi ajánlat")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Beszéljünk" })).toHaveAttribute("href", "/contact");
    expect(screen.queryByText(/Összesen .* Ft \+ ÁFA a teljes létszámra/)).not.toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "40+ fő");
  });

  it("az első beállítás egyetlen pricing.configure eseményt küld, létszám-sávval", () => {
    track.mockClear();
    render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);

    fireEvent.change(screen.getByRole("slider"), { target: { value: "14" } });
    fireEvent.click(screen.getByRole("button", { name: /Csapatprogram/ }));

    const configureCalls = track.mock.calls.filter(([name]) => name === "pricing.configure");
    expect(configureCalls).toHaveLength(1);
    expect(configureCalls[0][1]).toEqual({ tier: "kep", heads_band: "13-20" });
  });
});
