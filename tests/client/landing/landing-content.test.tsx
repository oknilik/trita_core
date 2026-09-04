import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LandingContent } from "@/components/landing/LandingContent";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/lib/analytics/client", () => ({
  track: vi.fn(),
}));

/**
 * A főoldal 2026-09-03 óta egyetlen, egyéni ígérettel nyit: nincs self/team
 * módváltó, nincs automatikus tab-bemutató. A csapatos út egy statikus
 * átvezető blokk, amely a pilotra és a /team-dynamics mélyoldalra visz.
 */
describe("főoldal – egy ígéret, egy oldal", () => {
  it("egyetlen H1-gyel, egyéni ígérettel nyit, és a profil-előnézetet rögtön mutatja", () => {
    const { container } = render(<LandingContent />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("~10 perc, és jobban megérted, hogyan működsz.");
    expect(headings[0]).not.toHaveClass("animate-rise-in");
    expect(screen.getByText("ÖNISMERET ÉS CSAPATMŰKÖDÉS")).toBeInTheDocument();

    // Nincs módváltó.
    expect(screen.queryByRole("link", { name: "Önismeret" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Csapatműködés" })).not.toBeInTheDocument();

    // A profil-előnézet a hero része, a valódi riport kivonatával.
    const preview = container.querySelector("[data-landing-hero-preview]");
    expect(preview).not.toBeNull();
    expect(within(preview as HTMLElement).getByText("Péter")).toBeInTheDocument();
    expect(within(preview as HTMLElement).getByText("Hídépítő")).toBeInTheDocument();
    expect(within(preview as HTMLElement).getByText("Valószínű csapatszerepeid")).toBeInTheDocument();
    expect(within(preview as HTMLElement).getByText("A pontos képhez külön csapatszerep-kérdőív tartozik.")).toBeInTheDocument();

    // Az elsődleges és a másodlagos szerep eltérő színt kap.
    const primaryRole = container.querySelector('[data-role-rank="primary"]');
    const secondaryRole = container.querySelector('[data-role-rank="secondary"]');
    expect(primaryRole).not.toBeNull();
    expect(secondaryRole).not.toBeNull();
    expect(primaryRole?.querySelector("span")?.getAttribute("style")).toContain("--color-sage");
    expect(secondaryRole?.querySelector("span")?.getAttribute("style")).toContain("--color-bronze");
  });

  it("a hero pirulái hordozzák a tényszerű ígéreteket (a korábbi StatsBar helyett)", () => {
    const { container } = render(<LandingContent />);

    const meta = container.querySelector("[data-landing-hero-meta]") as HTMLElement;
    expect(meta).not.toBeNull();
    for (const label of ["~10 perc", "Tudományos modell", "Azonnali eredmény", "Ingyenes"]) {
      expect(within(meta).getByText(label)).toBeInTheDocument();
    }
  });

  it("a visszajelzés szerinti tömör sorrendet rendereli: hero → lépések → bizonyíték → csapat → zárás", () => {
    const { container } = render(<LandingContent />);

    const h1 = screen.getByRole("heading", { level: 1 });
    const steps = screen.getByRole("heading", { name: /Három lépésben kapsz használható képet/ });
    const proof = screen.getByRole("heading", { name: /Mitől több ez egy/ });
    const team = screen.getByRole("heading", { name: "Csapatként folytatnátok?" });
    const closing = screen.getByRole("heading", { name: /Egy kérdőív, és tisztábban látod/ });

    const order = [h1, steps, proof, team, closing];
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i - 1].compareDocumentPosition(order[i])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }

    // Csillagos brand-motívum a lépések és a bizonyíték-szekció közt.
    const brandMark = container.querySelector("[data-landing-brand-mark]") as HTMLElement;
    expect(brandMark.querySelector("svg")).not.toBeNull();
    expect(steps.compareDocumentPosition(brandMark)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(brandMark.compareDocumentPosition(proof)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    // A bizonyíték-szekció megtartja az idézetet.
    expect(screen.getByText(/Most értettem meg, miért kerülök újra és újra/)).toBeInTheDocument();
  });

  it("minden egyéni CTA a tesztre visz, a záró blokk megtartja az együttműködés útját", () => {
    render(<LandingContent />);

    expect(screen.getByRole("link", { name: "Elindítom az ingyenes tesztet" })).toHaveAttribute("href", "/try");
    expect(screen.getByRole("link", { name: "Elindítom a tesztet" })).toHaveAttribute("href", "/try");
    expect(screen.getByRole("link", { name: "Együttműködés részletei" })).toHaveAttribute("href", "/how-we-work");
  });

  it("a csapatos átvezető elsődlegesen a /team-dynamics oldalra, másodlagosan a pilotra visz", () => {
    const { container } = render(<LandingContent />);

    const pathway = container.querySelector("[data-landing-team-pathway]") as HTMLElement;
    expect(pathway).not.toBeNull();
    const primaryCta = within(pathway).getByRole("link", { name: /A csapatdiagnosztika részletei/ });
    const secondaryCta = within(pathway).getByRole("link", { name: /Megnézem a pilotprogramot/ });
    expect(primaryCta).toHaveAttribute("href", "/team-dynamics");
    expect(primaryCta).toHaveClass("bg-[var(--color-accent-primary-soft)]");
    expect(secondaryCta).toHaveAttribute("href", "/pilot");
    expect(secondaryCta).not.toHaveClass("bg-[var(--color-accent-primary-soft)]");
    expect(primaryCta.compareDocumentPosition(secondaryCta)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    // Az egyéni profilok, a három mérési réteg és az átfutási ígéret a blokkban él.
    for (const layer of ["Egyéni személyiségprofilok", "Mért bizalmi háló", "Pszichológiai biztonság", "Jóváhagyott csapatkép"]) {
      expect(within(pathway).getByText(layer)).toBeInTheDocument();
    }
    expect(within(pathway).getByText(/~30 perc tagonkénti kitöltés/)).toBeInTheDocument();

    // A csapatkép-előnézet NEM a főoldalon él (a /team-dynamics hero-jában
    // igen): helyén a szerkesztői „kapcsolódás" rajz, dekorációként.
    expect(within(pathway).queryByText("Családi Vállalkozás")).not.toBeInTheDocument();
    const art = pathway.querySelector("[data-landing-team-art] svg");
    expect(art).not.toBeNull();
    expect(art).toHaveAttribute("aria-hidden", "true");
    // Három tömör forma, egy gerinc-vonal, csillag és nap: a nyelv teljes hármasa.
    expect(art?.querySelectorAll("[data-art-form]").length).toBe(3);
    expect(art?.querySelector("[data-art-spine]")).not.toBeNull();
    expect(art?.querySelector("[data-art-star]")).not.toBeNull();
  });
});
