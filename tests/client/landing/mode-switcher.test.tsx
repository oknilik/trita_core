import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModeSwitcher } from "@/components/landing/ModeSwitcher";
import { useSiteMode } from "@/components/landing/site-mode";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/lib/analytics/client", () => ({
  track: vi.fn(),
}));

describe("landing módválasztó", () => {
  function SwitcherHarness() {
    const mode = useSiteMode();
    return <ModeSwitcher mode={mode} />;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState({}, "", "/");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("megmutatja a csapatműködés fület, majd visszavált, ha a látogató nem lép közbe", () => {
    render(<SwitcherHarness />);

    expect(screen.getByRole("link", { name: "Önismeret" })).toHaveAttribute("aria-current", "page");

    act(() => vi.advanceTimersByTime(1800));

    expect(screen.getByRole("link", { name: "Csapatműködés" })).toHaveAttribute("aria-current", "page");
    expect(window.location.pathname).toBe("/");

    act(() => vi.advanceTimersByTime(2400));

    expect(screen.getByRole("link", { name: "Önismeret" })).toHaveAttribute("aria-current", "page");
    expect(window.location.pathname).toBe("/");
  });

  it("nem vált automatikusan, ha a látogató használni kezdi az oldalt", () => {
    render(<SwitcherHarness />);

    fireEvent.pointerDown(document.body);
    act(() => vi.advanceTimersByTime(1800));

    expect(screen.getByRole("link", { name: "Önismeret" })).toHaveAttribute("aria-current", "page");
    expect(window.location.pathname).toBe("/");
  });

  it("valódi landing URL-ekre linkel, és a direkt team oldalt nem váltja el", () => {
    window.history.replaceState({}, "", "/team-dynamics");
    render(<SwitcherHarness />);

    expect(screen.getByRole("link", { name: "Önismeret" })).toHaveAttribute(
      "href",
      "/self-awareness",
    );
    expect(screen.getByRole("link", { name: "Csapatműködés" })).toHaveAttribute(
      "href",
      "/team-dynamics",
    );

    act(() => vi.advanceTimersByTime(5000));

    expect(screen.getByRole("link", { name: "Csapatműködés" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(window.location.pathname).toBe("/team-dynamics");
  });
});
