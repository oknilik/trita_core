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

describe("ProfileHero – elsődleges CTA a sötét herón", () => {
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
    const { container } = render(
      <ProfileHero
        userName="Teszt Anna"
        completedAt="2026. augusztus 1."
        personalityType="Módszeres újító"
        glyphDimensions={GLYPH_DIMS}
        insight="Lendületet adsz a környezetednek."
      />,
    );

    expect(screen.getByRole("heading", { name: "Teszt Anna" })).toBeInTheDocument();
    expect(screen.getByText("A te karakterábrád").closest("[aria-hidden]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const initialSwipeButton = screen.getByRole("button", { name: "Karakterábra megjelenítése" });
    expect(initialSwipeButton).toHaveClass("h-12", "w-12", "rounded-full");
    expect(screen.getByText("Karakterábra")).toHaveClass("hidden", "md:block");
    expect(container.querySelector("[data-profile-swipe-frame]")).toHaveStyle({ height: "330px" });
    expect(container.querySelector("[data-profile-swipe-motion]")).not.toHaveClass("h-[330px]");
    expect(container.querySelector("[data-profile-glyph-slide]")).not.toHaveClass("h-[330px]");
    const profileContent = container.querySelector(
      "[data-profile-swipe-motion] section > div:nth-child(2)",
    );
    expect(profileContent).toHaveClass("md:flex", "md:justify-center");
    expect(container.querySelector("#profile-hero-glyph-side")?.parentElement).toHaveClass(
      "md:!mt-0",
    );
    expect(container.querySelector("[data-profile-glyph-slide]")?.getAttribute("style")).toContain(
      "translate3d(13px",
    );

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
      const profileFrames = animate.mock.calls[2]?.[0] as Keyframe[];
      const glyphFrames = animate.mock.calls[3]?.[0] as Keyframe[];
      expect(profileFrames.at(-1)?.transform).toBe("translate3d(-13px, 0, 0)");
      expect(glyphFrames.at(-1)?.transform).toBe("translate3d(0px, 0, 0)");
      expect(profileFrames).toEqual(expect.not.arrayContaining([
        expect.objectContaining({ opacity: expect.anything() }),
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

  it("újraméri a tartalom magasságát méretezéskor és nézetváltáskor", async () => {
    let onResize: ResizeObserverCallback = () => {};
    let profileHeight = 480;
    const rect = vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      const height = this.hasAttribute("data-profile-swipe-motion") ? profileHeight
        : this.hasAttribute("data-profile-glyph-slide") ? 620 : 330;
      return { x: 0, y: 0, top: 0, left: 0, right: 390, bottom: height, width: 390, height, toJSON: () => ({}) };
    });
    const observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: ResizeObserverCallback) { onResize = callback; }
      observe = observer.observe;
      unobserve = observer.unobserve;
      disconnect = observer.disconnect;
    });
    try {
      const { container, unmount } = render(
        <ProfileHero userName="Hosszú személynév" completedAt="2026" personalityType="Újító"
          glyphDimensions={GLYPH_DIMS} insight="Hosszabb értelmezés." onShare={vi.fn()} onDownloadPdf={vi.fn()} />,
      );
      const frame = container.querySelector("[data-profile-swipe-frame]");
      expect(frame).toHaveStyle({ height: "480px" });
      profileHeight = 980;
      onResize([], observer as unknown as ResizeObserver);
      expect(frame).toHaveStyle({ height: "980px" });
      expect(screen.getByRole("button", { name: /PDF letöltés/ })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Karakterábra megjelenítése" }));
      expect(frame).toHaveStyle({ height: "620px" });
      expect(screen.queryByRole("button", { name: /PDF letöltés/ })).toBeNull();
      await userEvent.click(screen.getByRole("button", { name: "Profil megjelenítése" }));
      expect(frame).toHaveStyle({ height: "980px" });
      expect(screen.getByRole("button", { name: /PDF letöltés/ })).toBeInTheDocument();
      unmount();
      expect(observer.disconnect).toHaveBeenCalled();
    } finally {
      rect.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it.each([
    { scores: [82, 55, 54], explanation: /A második és harmadik dimenzió pontszáma közeli/, wrong: /A két dimenziód közel azonos/ },
    { scores: [82, 80, 54], explanation: /A két dimenziód közel azonos/, wrong: /A második és harmadik dimenzió pontszáma közeli/ },
  ])("a látható pontszámokhoz tartozó bizonytalanságot magyarázza: $scores", async ({ scores, explanation, wrong }) => {
    render(
      <ProfileHero
        userName="Teszt Anna"
        completedAt="2026. szeptember 10."
        personalityType="Elvhű"
        glyphDimensions={["H", "E", "X"].map((code, index) => ({ code, score: scores[index] }))}
        insight="Egyéni összkép."
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Karakterábra megjelenítése" }));
    expect(screen.getByText(explanation)).toBeInTheDocument();
    expect(screen.queryByText(wrong)).toBeNull();
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
