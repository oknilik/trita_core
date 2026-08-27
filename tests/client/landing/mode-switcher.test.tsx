import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModeSwitcher } from "@/components/landing/ModeSwitcher";

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ locale: "hu", setLocale: vi.fn(), isChanging: false }),
}));

vi.mock("@/lib/analytics/client", () => ({
  track: vi.fn(),
}));

describe("landing módválasztó", () => {
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

  it("egyszer megmutatja a csapatműködés fület, ha a látogató nem lép közbe", () => {
    render(<ModeSwitcher />);

    expect(screen.getByRole("button", { name: "Önismeret" })).toHaveAttribute("aria-pressed", "true");

    act(() => vi.advanceTimersByTime(1800));

    expect(screen.getByRole("button", { name: "Csapatműködés" })).toHaveAttribute("aria-pressed", "true");
  });

  it("nem vált automatikusan, ha a látogató használni kezdi az oldalt", () => {
    render(<ModeSwitcher />);

    fireEvent.pointerDown(document.body);
    act(() => vi.advanceTimersByTime(1800));

    expect(screen.getByRole("button", { name: "Önismeret" })).toHaveAttribute("aria-pressed", "true");
  });
});
