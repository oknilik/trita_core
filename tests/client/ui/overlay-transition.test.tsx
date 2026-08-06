/**
 * Modal + Picker átmenet-tesztek (Vitest + RTL)
 *
 * A framer-motion `AnimatePresence` helyére a `useOverlayTransition` hook
 * lépett. Amit itt rögzítünk, az a szerződése:
 *  - nyitáskor a panel elébb a KIINDULÓ (rejtett) osztályokkal kerül a DOM-ba,
 *    csak utána vált „belépettre" — enélkül nem indulna CSS-átmenet;
 *  - záráskor a panel a kilépő átmenet VÉGÉIG a DOM-ban marad;
 *  - a body scroll-zár és a kereső-fókusz a régi időzítéssel működik.
 */

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Modal } from "@/components/ui/Modal";
import { Picker } from "@/components/ui/Picker";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function panelOf(node: HTMLElement) {
  return node.closest("div.transition-all") as HTMLElement;
}

describe("Modal", () => {
  it("csukva nem renderel semmit", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Cím">
        <p>Törzs</p>
      </Modal>,
    );
    expect(screen.queryByText("Törzs")).not.toBeInTheDocument();
  });

  it("a kiinduló állapotból vált belépettre (különben nincs átmenet)", async () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}} title="Cím">
        <p>Törzs</p>
      </Modal>,
    );
    rerender(
      <Modal isOpen onClose={() => {}} title="Cím">
        <p>Törzs</p>
      </Modal>,
    );

    expect(panelOf(screen.getByText("Törzs")).className).toContain("opacity-0");

    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    expect(panelOf(screen.getByText("Törzs")).className).toContain(
      "opacity-100",
    );
  });

  it("a kilépő átmenet alatt a DOM-ban marad, utána tűnik el", async () => {
    const { rerender } = render(
      <Modal isOpen onClose={() => {}} title="Cím">
        <p>Törzs</p>
      </Modal>,
    );
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Cím">
        <p>Törzs</p>
      </Modal>,
    );
    // Kilépőben: még jelen van, de már a rejtett osztályokkal.
    expect(screen.getByText("Törzs")).toBeInTheDocument();
    expect(panelOf(screen.getByText("Törzs")).className).toContain("opacity-0");

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText("Törzs")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("Picker", () => {
  const options = [
    { value: "hu", label: "Magyarország" },
    { value: "at", label: "Ausztria" },
  ];

  it("nyitáskor fókuszálja a keresőt, záráskor kivárja a 300 ms-os kicsúszást", async () => {
    const { rerender } = render(
      <Picker
        isOpen={false}
        onClose={() => {}}
        onSelect={() => {}}
        options={options}
        title="Ország"
        searchable
        searchPlaceholder="Keresés"
      />,
    );
    expect(screen.queryByText("Ausztria")).not.toBeInTheDocument();

    rerender(
      <Picker
        isOpen
        onClose={() => {}}
        onSelect={() => {}}
        options={options}
        title="Ország"
        searchable
        searchPlaceholder="Keresés"
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(document.activeElement).toBe(screen.getByPlaceholderText("Keresés"));

    rerender(
      <Picker
        isOpen={false}
        onClose={() => {}}
        onSelect={() => {}}
        options={options}
        title="Ország"
        searchable
        searchPlaceholder="Keresés"
      />,
    );
    // 299 ms-nél még bent van — a kicsúszás nem vágódhat félbe.
    await act(async () => {
      vi.advanceTimersByTime(299);
    });
    expect(screen.getByText("Ausztria")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText("Ausztria")).not.toBeInTheDocument();
  });
});
