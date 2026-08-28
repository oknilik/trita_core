import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CtaSection } from "@/components/landing/CtaSection";
import { HeroSection } from "@/components/landing/HeroSection";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/components/landing/ModeSwitcher", () => ({
  ModeSwitcher: () => <div data-testid="mode-switcher" />,
}));

vi.mock("@/lib/analytics/client", () => ({
  track: vi.fn(),
}));

describe("landing CTA-hierarchia", () => {
  it("a hero H1-et animáció nélkül, az első festéskor láthatóan rendereli", () => {
    render(<HeroSection mode="self" />);

    expect(screen.getByRole("heading", { level: 1 })).not.toHaveClass("animate-rise-in");
  });

  it("csapatmódban a pilotprogram az elsődleges út, a kapcsolatfelvétel csendes másodlagos", () => {
    render(
      <>
        <HeroSection mode="team" />
        <CtaSection mode="team" />
      </>,
    );

    expect(
      screen.getAllByRole("link", { name: "Megnézem a pilotprogramot" }).every((link) =>
        link.getAttribute("href") === "/pilot"
      ),
    ).toBe(true);
    expect(screen.getByRole("link", { name: "Beszéljünk" })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.queryByText("Legyetek az első partnercsapataink között")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /kipróbál/i })).not.toBeInTheDocument();
  });

  it("a hero CTA-ja a riport-előnézet előtt marad a mobil DOM-sorrendben", () => {
    const { container } = render(<HeroSection mode="team" />);

    const primaryCta = screen.getByRole("link", { name: "Megnézem a pilotprogramot" });
    const preview = container.querySelector("[data-landing-hero-preview]");

    expect(preview).not.toBeNull();
    expect(primaryCta.compareDocumentPosition(preview as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("mobilon is megtartja a teljes személyes és csapatos eredménykivonatot", () => {
    const self = render(<HeroSection mode="self" />);

    expect(self.container.querySelector('[data-landing-preview-detail="self-strengths"]')).not.toHaveClass("hidden");
    expect(self.container.querySelector('[data-landing-preview-detail="self-roles"]')).not.toHaveClass("hidden");

    self.unmount();
    const team = render(<HeroSection mode="team" />);
    expect(team.container.querySelector('[data-landing-preview-detail="team-narrative"]')).not.toHaveClass("hidden");
  });

  it("egyéni módban megtartja a teszt és az együttműködés útvonalát", () => {
    render(
      <>
        <HeroSection mode="self" />
        <CtaSection mode="self" />
      </>,
    );

    expect(screen.getAllByRole("link", { name: /teszt/i }).every((link) =>
      link.getAttribute("href") === "/try"
    )).toBe(true);
    expect(screen.getByRole("link", { name: "Együttműködés részletei" })).toHaveAttribute(
      "href",
      "/how-we-work",
    );
  });
});
