/**
 * ProfileHero client tests (Vitest + RTL) — motor-audit v6, M7.
 *
 * A self-hero elsődleges CTA-ja (PDF letöltés) korábban a brand-bronz
 * (#c17f4a) töltést kapta, ami a sötét zsálya-gradiensen ~2,7:1 — a gomb
 * beleolvadt a heróba. A működő herók (team/org/candidate) mintája: VILÁGOS
 * töltés + sötét `text-on-accent` felirat. A teszt a token-párost őrzi
 * (inline style-ban él, hogy a variant-osztályokkal ne legyen kaszkád-verseny).
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProfileHero } from "@/components/results/ProfileHero";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

const GLYPH_DIMS = [
  { code: "H", score: 55 },
  { code: "E", score: 50 },
  { code: "X", score: 45 },
  { code: "A", score: 30 },
  { code: "C", score: 74 },
  { code: "O", score: 90 },
];

describe("ProfileHero — elsődleges CTA a sötét herón", () => {
  it("a PDF-gomb világos akcent-töltést és sötét on-accent feliratot kap", () => {
    render(
      <ProfileHero
        userName="Teszt Anna"
        completedAt="2026. augusztus 1."
        personalityType="Módszeres újító"
        glyphDimensions={GLYPH_DIMS}
        insight="Lendületet adsz a környezetednek."
        onShare={vi.fn()}
        onDownloadPdf={vi.fn()}
      />,
    );

    const pdfButton = screen.getByRole("button", { name: /PDF letöltés/ });
    const style = pdfButton.getAttribute("style") ?? "";
    // Világos bronz töltés (mindkét színsémában világos marad)…
    expect(style).toContain("--color-accent-primary-soft");
    // …sötét, akcent-háttérre szánt felirat.
    expect(style).toContain("--color-text-on-accent");
    // A régi, hеróba olvadó brand-bronz töltés nem térhet vissza.
    expect(style).not.toContain("#c17f4a");
  });

  it("a reszponzív swipe-vezérlő a teljes karakterábra és a profil között vált", async () => {
    render(
      <ProfileHero
        userName="Teszt Anna"
        completedAt="2026. augusztus 1."
        personalityType="Módszeres újító"
        glyphDimensions={GLYPH_DIMS}
        insight="Lendületet adsz a környezetednek."
      />,
    );

    expect(screen.getByRole("heading", { name: "Teszt Anna" })).toBeInTheDocument();
    expect(screen.queryByText("A te karakterábrád")).toBeNull();
    const initialSwipeButton = screen.getByRole("button", { name: "Karakterábra megjelenítése" });
    expect(initialSwipeButton).toHaveClass("h-12", "w-12", "rounded-full");
    expect(screen.getByText("Karakterábra")).toHaveClass("hidden", "md:block");

    await userEvent.click(initialSwipeButton);

    expect(screen.queryByRole("heading", { name: "Teszt Anna" })).toBeNull();
    expect(screen.getByText("A te karakterábrád")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /absztrakt típus-ábra/ })).toBeInTheDocument();
    expect(screen.getByText(/A nagy forma.*szem.*létrafokok/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Profil megjelenítése" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(screen.getByRole("button", { name: "Profil megjelenítése" }));
    expect(screen.getByRole("heading", { name: "Teszt Anna" })).toBeInTheDocument();
  });

  it("finom betöltési jelzést és keresztbe csúszó nézetváltást használ", async () => {
    const previousAnimate = Object.getOwnPropertyDescriptor(Element.prototype, "animate");
    const cancel = vi.fn();
    const animate = vi.fn((..._args: Parameters<Element["animate"]>) => ({
      cancel,
      addEventListener: vi.fn(),
    }) as unknown as Animation);
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      value: animate,
    });

    try {
      const { unmount } = render(
        <ProfileHero
          userName="Teszt Anna"
          completedAt="2026. augusztus 1."
          personalityType="Módszeres újító"
          glyphDimensions={GLYPH_DIMS}
          insight="Lendületet adsz a környezetednek."
        />,
      );

      await waitFor(() => expect(animate).toHaveBeenCalledTimes(2));
      expect(animate.mock.calls[0]?.[0]).toEqual(expect.arrayContaining([
        expect.objectContaining({ transform: "translate3d(-4px, 0, 0)" }),
      ]));
      expect(animate.mock.calls[1]?.[0]).toEqual(expect.arrayContaining([
        expect.objectContaining({ transform: "translate3d(-3px, 0, 0)" }),
      ]));

      await userEvent.click(screen.getByRole("button", { name: "Karakterábra megjelenítése" }));
      await waitFor(() => expect(animate).toHaveBeenCalledTimes(5));
      expect(animate.mock.calls[2]?.[0]).toEqual(expect.arrayContaining([
        expect.objectContaining({ opacity: 0.94, transform: "translate3d(-22px, 0, 0)" }),
      ]));
      expect(animate.mock.calls[3]?.[0]).toEqual(expect.arrayContaining([
        expect.objectContaining({ opacity: 0.94, transform: "translate3d(22px, 0, 0)" }),
      ]));

      unmount();
      expect(cancel).toHaveBeenCalledTimes(5);
    } finally {
      if (previousAnimate) {
        Object.defineProperty(Element.prototype, "animate", previousAnimate);
      } else {
        delete (Element.prototype as unknown as { animate?: Element["animate"] }).animate;
      }
    }
  });

  it("mobilos balra swipe-pal megnyitja a karakterábrát, függőleges húzásra nem vált", () => {
    const { container } = render(
      <ProfileHero
        userName="Teszt Anna"
        completedAt="2026. augusztus 1."
        personalityType="Módszeres újító"
        glyphDimensions={GLYPH_DIMS}
        insight="Lendületet adsz a környezetednek."
      />,
    );
    const swipeSurface = container.querySelector("[data-profile-swipe-motion]");
    expect(swipeSurface).not.toBeNull();

    fireEvent.pointerDown(swipeSurface!, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 280,
      clientY: 180,
    });
    fireEvent.pointerUp(swipeSurface!, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 275,
      clientY: 260,
    });
    expect(screen.getByRole("heading", { name: "Teszt Anna" })).toBeInTheDocument();

    fireEvent.pointerDown(swipeSurface!, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 290,
      clientY: 180,
    });
    fireEvent.pointerMove(swipeSurface!, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 230,
      clientY: 182,
    });
    fireEvent.pointerUp(swipeSurface!, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 205,
      clientY: 182,
    });

    expect(screen.getByText("A te karakterábrád")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Profil megjelenítése" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("karakteradat nélkül nem mutat lapfület", () => {
    render(
      <ProfileHero
        userName="Teszt Anna"
        completedAt="2026. augusztus 1."
        personalityType="Profil"
        insight="Rövid összefoglaló."
      />,
    );

    expect(screen.queryByRole("button", { name: "Karakterábra megjelenítése" })).toBeNull();
  });
});
