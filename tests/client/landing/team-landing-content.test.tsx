import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamLandingContent } from "@/components/landing/TeamLandingContent";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/lib/analytics/client", () => ({
  track: vi.fn(),
}));

/**
 * A /team-dynamics a csapatdiagnosztika statikus mélyoldala: a korábbi
 * csapat-módú landing teljes tartalma, módváltó nélkül.
 */
describe("csapatdiagnosztika-mélyoldal", () => {
  it("csapatos ígérettel nyit, módváltó nélkül, és a csapatkép-előnézetet mutatja", () => {
    const { container } = render(<TeamLandingContent />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Lássátok tisztán, hogyan működik együtt a csapatotok.");
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
});
