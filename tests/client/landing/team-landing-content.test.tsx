import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamLandingContent } from "@/components/landing/TeamLandingContent";
import { DEFAULT_RATE_CARD } from "@/lib/quote/rate-card";
import { derivePublicLadder, formatHuf } from "@/lib/pricing/team-ladder";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/lib/analytics/client", () => ({
  track: vi.fn(),
}));

const ladder = derivePublicLadder(DEFAULT_RATE_CARD);
const plain = (value: string) => value.replace(/ /g, " ");

/**
 * A /team-dynamics 2026-09-08 óta az egyesített csapat-oldal: a
 * csapatdiagnosztika mélyoldala és a korábbi /how-we-work egy lapon. Az ár
 * itt csak horgony, a kalkulátor az /pricing oldalon él.
 */
describe("csapat-oldal (egyesített)", () => {
  it("csapatos ígérettel nyit, módváltó nélkül, és a csapatkép-előnézetet mutatja", () => {
    const { container } = render(<TeamLandingContent ladder={ladder} />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Értsétek meg jobban a csapatotok működését.");
    expect(screen.queryByRole("link", { name: "Önismeret" })).not.toBeInTheDocument();

    const preview = container.querySelector("[data-landing-hero-preview]");
    expect(preview).not.toBeNull();
    expect(container.querySelector('[data-landing-preview-detail="team-narrative"]')).not.toBeNull();
    expect(screen.getByText("Családi Vállalkozás")).toBeInTheDocument();
  });

  it("az elsődleges út az egyeztetés, az árak és a pilot másodlagosak", () => {
    render(<TeamLandingContent ladder={ladder} />);

    const contactLinks = screen.getAllByRole("link", { name: /Egyeztessünk/ });
    expect(contactLinks.length).toBeGreaterThanOrEqual(2);
    expect(contactLinks.every((link) => link.getAttribute("href") === "/contact")).toBe(true);

    const pricingLinks = screen.getAllByRole("link", { name: /Árak és kalkulátor|Részletes árak/ });
    expect(pricingLinks.length).toBeGreaterThanOrEqual(2);
    expect(pricingLinks.every((link) => link.getAttribute("href") === "/pricing")).toBe(true);

    expect(screen.getByRole("link", { name: /Vagy nézd meg a pilotprogramot/ })).toHaveAttribute("href", "/pilot");
    expect(screen.queryByRole("link", { name: /kipróbál|teszt/i })).not.toBeInTheDocument();
  });

  it("az ár-horgony a díjkártya belépő árát mutatja, kalkulátor nélkül", () => {
    const { container } = render(<TeamLandingContent ladder={ladder} />);

    const anchor = container.querySelector("[data-team-price-anchor]") as HTMLElement;
    expect(anchor).not.toBeNull();
    expect(within(anchor).getByText(plain(formatHuf(ladder.tiers.kep.perHead)))).toBeInTheDocument();
    expect(within(anchor).getByRole("link", { name: /Részletes árak/ })).toHaveAttribute("href", "/pricing");
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("megtartja a három mérési réteget, a három lépést, a pilot-helyeket és a program-GYIK-et", () => {
    const { container } = render(<TeamLandingContent ladder={ladder} />);

    for (const title of ["Mért bizalmi háló", "Pszichológiai biztonság", "Közösen értelmezett csapatkép"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    for (const step of ["Tisztázzuk a célt és a keretet", "Kitöltés és tanácsadói ellenőrzés", "Közösen értelmezzük"]) {
      expect(screen.getByRole("heading", { name: step })).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: /hagyományos csapatfelmérésnél/ })).toBeInTheDocument();
    expect(container.querySelector("[data-pilot-spots]")).toHaveAttribute("href", "/pilot");
    // A program-GYIK itt, az ár-GYIK az /pricing oldalon.
    expect(screen.getByText("Hogyan indul az együttműködés?")).toBeInTheDocument();
    expect(screen.queryByText("Mennyibe kerül?")).not.toBeInTheDocument();
  });
});
