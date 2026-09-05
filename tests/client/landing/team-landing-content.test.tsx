import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamLandingContent } from "@/components/landing/TeamLandingContent";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/lib/analytics/client", () => ({
  track: vi.fn(),
}));

/**
 * A /team-dynamics a csapatintelligencia-pillar: a korábbi csapat-módú
 * landing teljes tartalma, módváltó nélkül, plusz a kategória-definíció, a
 * fogalomtár és a GYIK (2026-09-05). A főoldal egyéni belépő marad; a
 * „Mi a csapatintelligencia?" szekció ITT él.
 */
describe("csapatdiagnosztika-mélyoldal", () => {
  it("csapatos ígérettel nyit, módváltó nélkül, és a csapatkép-előnézetet mutatja", () => {
    const { container } = render(<TeamLandingContent />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Értsétek meg jobban a csapatotok működését.");
    expect(screen.queryByRole("link", { name: "Önismeret" })).not.toBeInTheDocument();

    const preview = container.querySelector("[data-landing-hero-preview]");
    expect(preview).not.toBeNull();
    expect(container.querySelector('[data-landing-preview-detail="team-narrative"]')).not.toBeNull();
    expect(screen.getByText("Családi Vállalkozás")).toBeInTheDocument();
  });

  it("minden elsődleges út a pilot, a kapcsolatfelvétel csendes másodlagos", () => {
    render(<TeamLandingContent />);

    const pilotLinks = screen.getAllByRole("link", { name: "Megnézem a pilotprogramot" });
    expect(pilotLinks.length).toBeGreaterThanOrEqual(2);
    expect(pilotLinks.every((link) => link.getAttribute("href") === "/pilot")).toBe(true);
    expect(screen.getByRole("link", { name: "Beszéljünk" })).toHaveAttribute("href", "/contact");
    expect(screen.queryByRole("link", { name: /kipróbál|teszt/i })).not.toBeInTheDocument();
  });

  it("megtartja a három mérési réteget és a csapatos „miért más” történetet", () => {
    render(<TeamLandingContent />);

    for (const title of ["Mért bizalmi háló", "Pszichológiai biztonság", "Jóváhagyott csapatkép"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: /hagyományos csapatfelmérésnél/ })).toBeInTheDocument();
    expect(screen.getByText("a jóváhagyott csapatképig")).toBeInTheDocument();
  });

  it("a kategória-definíció, a fogalomtár és a GYIK a pillaron él, a hero után", () => {
    const { container } = render(<TeamLandingContent />);

    const h1 = screen.getByRole("heading", { level: 1 });
    const definition = screen.getByRole("heading", { name: "Mi a csapatintelligencia?" });
    const glossary = screen.getByRole("heading", { name: "A csapatkép fogalmai" });
    const faq = screen.getByRole("heading", { name: "Gyakori kérdések a csapatdiagnosztikáról" });
    const steps = screen.getByRole("heading", { name: /Három lépésben kaptok/ });

    // hero → definíció → lépések → … → GYIK
    const order = [h1, definition, glossary, steps, faq];
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i - 1].compareDocumentPosition(order[i])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }

    // A fogalomtár hat tétele, köztük a kategórianév.
    const glossaryBlock = container.querySelector("[data-team-glossary]") as HTMLElement;
    expect(glossaryBlock.querySelectorAll("dt")).toHaveLength(6);
    expect(within(glossaryBlock).getByText("Csapatintelligencia")).toBeInTheDocument();

    // A GYIK hat tétele, és az Együttműködés felé vezető link.
    const faqBlock = container.querySelector("[data-team-faq]") as HTMLElement;
    expect(faqBlock.querySelectorAll("details")).toHaveLength(6);
    expect(within(faqBlock).getByRole("link", { name: /Így dolgozunk együtt/ })).toHaveAttribute("href", "/how-we-work");
  });
});
