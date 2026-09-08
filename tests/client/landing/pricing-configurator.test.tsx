import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamPricingConfigurator } from "@/components/pricing/TeamPricingConfigurator";
import { DEFAULT_RATE_CARD } from "@/lib/quote/rate-card";
import { derivePublicLadder, formatHuf, ladderPrice } from "@/lib/pricing/team-ladder";

const track = vi.fn();
vi.mock("@/lib/analytics/client", () => ({
  track: (...args: unknown[]) => track(...args),
}));

const ladder = derivePublicLadder(DEFAULT_RATE_CARD);
// A hu-HU ezres tagoló nem törő szóköz; a DOM-szöveg normalizálva sima
// szóközzel jön vissza, ezért az elvárt szöveget is arra hozzuk.
const plain = (value: string) => value.replace(/\u00a0/g, " ");

/**
 * A /how-we-work árblokk: a látogató a két szint és a létszám alapján
 * ugyanazt a számot látja, amit az admin kalkulátor az ajánlatba tesz.
 */
describe("TeamPricingConfigurator", () => {
  it("a Csapatkép szinttel és 10 fővel nyit, a hirdetett fejenkénti árral", () => {
    render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);

    const kep = screen.getByRole("button", { name: /Csapatkép/ });
    expect(kep).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("slider")).toHaveValue("10");
    expect(
      screen.getByText(plain(`Összesen ${formatHuf(ladderPrice(ladder, "kep", 10).total)} Ft a teljes létszámra`)),
    ).toBeInTheDocument();
  });

  it("a Csapatprogramra váltva az ár és a tartalom-lista frissül", () => {
    render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);

    fireEvent.click(screen.getByRole("button", { name: /Csapatprogram/ }));

    expect(screen.getByRole("button", { name: /Csapatprogram/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: /A Csapatprogram szintben benne van/ })).toBeInTheDocument();
    expect(
      screen.getByText(plain(`Összesen ${formatHuf(ladderPrice(ladder, "prog", 10).total)} Ft a teljes létszámra`)),
    ).toBeInTheDocument();
  });

  it("a sávhatár felett a fejenkénti átlag csökken, és a bontás mutatja a további főket", () => {
    render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);

    fireEvent.change(screen.getByRole("slider"), { target: { value: "20" } });

    const price = ladderPrice(ladder, "kep", 20);
    expect(price.perHeadAverage).toBeLessThan(ladder.tiers.kep.perHead);
    expect(screen.getByText("További fők")).toBeInTheDocument();
    expect(
      screen.getByText(plain(`${price.overHeads} × ${formatHuf(ladder.tiers.kep.perHeadOver)} Ft`)),
    ).toBeInTheDocument();
  });

  it("a létszám mellett mutatja, hány csapat lehet belőle – 35 fő 5–8 csapat", () => {
    const { container } = render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);
    const hint = () => container.querySelector("[data-pricing-teams-hint]")?.textContent;

    expect(hint()).toBe("1–2 csapat");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "35" } });
    expect(hint()).toBe("5–8 csapat");
    expect(screen.getByText(/35 fő lehet egy csapat vagy 5–8 kisebb/)).toBeInTheDocument();
    // Az ár nem függ a csapatok számától: ugyanaz a létszám-alapú összeg.
    expect(
      screen.getByText(plain(`Összesen ${formatHuf(ladderPrice(ladder, "kep", 35).total)} Ft a teljes létszámra`)),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "5" } });
    expect(hint()).toBe("egy csapat");
  });

  it("a csúszka végén (40+) szám helyett egyedi ajánlatot kínál", () => {
    render(<TeamPricingConfigurator ladder={ladder} locale="hu" />);

    fireEvent.change(screen.getByRole("slider"), { target: { value: "41" } });

    expect(screen.getByText("Egyedi ajánlat")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Beszéljünk" })).toHaveAttribute("href", "/contact");
    expect(screen.queryByText(/Összesen .* Ft a teljes létszámra/)).not.toBeInTheDocument();
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
