import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MobileMenuShell } from "@/components/layout/mobile-menu";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { Picker } from "@/components/ui/Picker";

function PickerHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open country picker
      </button>
      <Picker
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={() => setOpen(false)}
        options={[
          { value: "hu", label: "Hungary" },
          { value: "at", label: "Austria" },
        ]}
        title="Country"
        closeLabel="Close country picker"
        searchable
        searchPlaceholder="Search countries"
      />
    </>
  );
}

function MobileMenuHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open navigation
      </button>
      <MobileMenuShell open={open} onClose={() => setOpen(false)} label="Main navigation">
        <button type="button" onClick={() => setOpen(false)}>
          Close navigation
        </button>
        <a href="/profile">Profile</a>
      </MobileMenuShell>
    </>
  );
}

function ModalHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open details
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Hidden details title"
        description="Hidden details description"
        hideHeader
        closeLabel="Close details"
      >
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Modal>
    </>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  document.body.style.overflow = "";
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Picker accessibility contract", () => {
  it("exposes a named modal, traps focus, closes on Escape, and restores focus and scroll", async () => {
    document.body.style.overflow = "clip";
    render(<PickerHarness />);

    const trigger = screen.getByRole("button", { name: "Open country picker" });
    trigger.focus();
    fireEvent.click(trigger);

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    const dialog = screen.getByRole("dialog", { name: "Country" });
    const close = screen.getByRole("button", { name: "Close country picker" });
    const search = screen.getByRole("textbox", { name: "Search countries" });
    const lastOption = screen.getByRole("button", { name: "Austria" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(search).toHaveFocus();

    lastOption.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(lastOption).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("clip");
    expect(trigger).toHaveFocus();
  });

  it("closes and releases the focus/scroll lock when the desktop breakpoint becomes active", async () => {
    let changeListener: ((event: MediaQueryListEvent) => void) | undefined;
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        media: "(min-width: 64rem)",
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          changeListener = listener;
        },
        removeEventListener: vi.fn(),
      }),
    );
    document.body.style.overflow = "clip";
    render(<MobileMenuHarness />);

    const trigger = screen.getByRole("button", { name: "Open navigation" });
    trigger.focus();
    fireEvent.click(trigger);
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.getByRole("dialog", { name: "Main navigation" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    act(() => changeListener?.({ matches: true } as MediaQueryListEvent));

    expect(screen.queryByRole("dialog", { name: "Main navigation" })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("clip");
    expect(trigger).toHaveFocus();
  });
});

describe("MobileMenuShell accessibility contract", () => {
  it("exposes a named modal, traps focus, closes on Escape, and restores focus and scroll", async () => {
    document.body.style.overflow = "clip";
    render(<MobileMenuHarness />);

    const trigger = screen.getByRole("button", { name: "Open navigation" });
    trigger.focus();
    fireEvent.click(trigger);

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    const dialog = screen.getByRole("dialog", { name: "Main navigation" });
    const close = screen.getByRole("button", { name: "Close navigation" });
    const lastLink = screen.getByRole("link", { name: "Profile" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.body.style.overflow).toBe("hidden");
    // Érintéses megnyitáskor maga a dialog kap kezdeti fókuszt, így az
    // első menüponton iOS Safari alatt sem ragad ott a focus-visible keret.
    expect(dialog).toHaveFocus();

    lastLink.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(lastLink).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Main navigation" })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("clip");
    expect(trigger).toHaveFocus();
  });
});

describe("Modal accessibility contract", () => {
  it("keeps a hidden header as the accessible name and preserves nested scroll locks", async () => {
    document.body.style.overflow = "clip";
    render(<ModalHarness />);

    const trigger = screen.getByRole("button", { name: "Open details" });
    trigger.focus();
    fireEvent.click(trigger);

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    const dialog = screen.getByRole("dialog", { name: "Hidden details title" });
    const first = screen.getByRole("button", { name: "Close details" });
    const last = screen.getByRole("button", { name: "Last action" });
    expect(dialog).toHaveAccessibleDescription("Hidden details description");
    expect(document.body.style.overflow).toBe("hidden");
    expect(first).toHaveFocus();

    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(first).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("clip");
    expect(trigger).toHaveFocus();
  });

  it("names the headerless loading confirmation from its visible loading note", () => {
    render(
      <ConfirmModal
        isOpen
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm"
        description="Description"
        confirmText="Continue"
        cancelText="Cancel"
        isLoading
        loadingNote="Saving changes"
      />,
    );

    expect(screen.getByRole("dialog", { name: "Saving changes" })).toBeInTheDocument();
  });
});
