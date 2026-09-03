import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

/**
 * Módváltásnál (self ↔ team) a hero NEM ugorhat: a kapcsoló Y-pozíciója és
 * az előnézet-oszlop magassága módtól független. Korábban a rács
 * items-center-e az eltérő hosszú szöveg miatt újrapozicionálta az oszlopot,
 * az előnézet pedig komponens-cserével váltott (remount + magasság-ugrás).
 */
describe("hero – rögzített geometria módváltásnál", () => {
  it.each(["self", "team"] as const)("%s módban a kapcsoló a fix magasságú oszlop tetején ül, a szöveg alatta középre igazodik", (mode) => {
    const { container } = render(<HeroSection mode={mode} />);
    const copy = container.querySelector("[data-landing-hero-copy]");
    expect(copy).not.toBeNull();
    expect(copy).toHaveClass("md:min-h-[674px]");
    // A kapcsoló az oszlop ELSŐ gyermeke – a szöveg hossza nem tolhatja el.
    expect(copy!.firstElementChild!.querySelector('[data-testid="mode-switcher"]')).not.toBeNull();
    const body = copy!.querySelector("[data-landing-hero-copy-body]");
    expect(body).toHaveClass("md:my-auto");
  });

  it.each([
    ["self", "self-strengths", "team-narrative"],
    ["team", "team-narrative", "self-strengths"],
  ] as const)("%s módban mindkét panel a DOM-ban marad, csak az aktív látható és érhető el", (mode, activeDetail, inactiveDetail) => {
    const { container } = render(<HeroSection mode={mode} />);

    // Mindkét panel jelen van → a konténer magassága módtól független.
    expect(container.querySelector(`[data-landing-preview-detail="${activeDetail}"]`)).not.toBeNull();
    expect(container.querySelector(`[data-landing-preview-detail="${inactiveDetail}"]`)).not.toBeNull();

    // Pontosan egy aktív előnézet, és az tartalmazza az aktív panelt.
    const active = container.querySelectorAll("[data-landing-hero-preview]");
    expect(active).toHaveLength(1);
    expect(active[0].querySelector(`[data-landing-preview-detail="${activeDetail}"]`)).not.toBeNull();
    expect(active[0]).not.toHaveAttribute("aria-hidden");

    // Az inaktív láthatatlan és kikerül az a11y-fából.
    const inactive = container
      .querySelector(`[data-landing-preview-detail="${inactiveDetail}"]`)!
      .closest("[aria-hidden]");
    expect(inactive).not.toBeNull();
    expect(inactive).toHaveAttribute("aria-hidden", "true");
    expect(inactive).toHaveClass("invisible");
  });

  it("a két panel egy rácscellán osztozik (egymásra rakva, nem egymás alatt)", () => {
    const { container } = render(<HeroSection mode="self" />);
    const stack = container.querySelector("[data-landing-hero-preview]")!.parentElement!;
    expect(stack).toHaveClass("grid");
    expect(stack.className).toContain("[grid-area:1/1]");
    expect(stack.children).toHaveLength(2);
  });
});
