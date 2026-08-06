/**
 * ToastProvider client tests (Vitest + RTL)
 *
 * A toast be-/kilépése CSS-átmenetre épül (framer-motion `AnimatePresence`
 * helyett) — ezek a tesztek az ÉLETCIKLUST rögzítik: a toast 4 mp-ig látszik,
 * a kilépő átmenet alatt NEM tűnik el idő előtt a DOM-ból, több toast pedig
 * a megjelenés sorrendjében marad egymás alatt.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function Trigger() {
  const { showToast } = useToast();
  return (
    <>
      <button type="button" onClick={() => showToast("Első", "success")}>
        first
      </button>
      <button type="button" onClick={() => showToast("Második", "error")}>
        second
      </button>
    </>
  );
}

function renderProvider() {
  return render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ToastProvider", () => {
  it("4 mp után indítja a kilépést, és csak az átmenet UTÁN tünteti el", () => {
    renderProvider();
    act(() => {
      fireEvent.click(screen.getByText("first"));
    });
    expect(screen.getByText("Első")).toBeInTheDocument();

    // Épp a kilépés pillanata: még a DOM-ban kell lennie (különben a
    // kilépő animáció félbevágódna).
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText("Első")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText("Első")).not.toBeInTheDocument();
  });

  it("a bezáró gomb is végigjátssza a kilépő átmenetet", () => {
    renderProvider();
    act(() => {
      fireEvent.click(screen.getByText("first"));
    });

    const closeButton = screen
      .getByText("Első")
      .parentElement!.querySelector("button")!;
    act(() => {
      fireEvent.click(closeButton);
    });
    expect(screen.getByText("Első")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText("Első")).not.toBeInTheDocument();

    // A kézi bezárás után nem maradhat élő auto-eltűnés időzítő: különben
    // 4 mp-nél a már eltávolított toast újra végigfutna a kilépő ágon.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("több toastot a megjelenés sorrendjében tart egymás alatt", () => {
    renderProvider();
    act(() => {
      fireEvent.click(screen.getByText("first"));
      fireEvent.click(screen.getByText("second"));
    });

    const firstItem = screen.getByText("Első").parentElement!;
    const secondItem = screen.getByText("Második").parentElement!;
    // Közös, oszlop-elrendezésű konténer — a sorrend a megjelenésé.
    expect(firstItem.parentElement).toBe(secondItem.parentElement);
    const stack = Array.from(firstItem.parentElement!.children);
    expect(stack.indexOf(firstItem)).toBeLessThan(stack.indexOf(secondItem));
  });
});
