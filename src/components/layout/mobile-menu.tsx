"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

// ─────────────────────────────────────────────────────────────────────
// Közös mobilmenü-váz (2026-07-29, menü-konvergencia): a kijelentkezett
// (NavBar) és a belépett (NavHeaderUI) mobilmenü UGYANEZT a kártya-panel
// formát használja — backdrop + fejléc alatti lekerekített kártya + ikonos
// sorok. Így a belépés előtti/utáni élmény nem törik meg, és a menü-stílus
// egy helyen él.
// ─────────────────────────────────────────────────────────────────────

export function MobileMenuShell({
  open,
  onClose,
  children,
  label = "Menu",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onCloseRef.current();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => !element.hasAttribute("hidden"));

    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const desktopQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(min-width: 64rem)")
        : null;
    if (desktopQuery?.matches) {
      onCloseRef.current();
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    desktopQuery?.addEventListener("change", closeAtDesktop);
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      (firstFocusable ?? panelRef.current)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery?.removeEventListener("change", closeAtDesktop);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;
  return (
    <>
      {/* Puha backdrop (stílus-transzfer a marketing-menüből): finom blur,
          kevesebb sötétítés — a lap érezhetően "mögötte" marad. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-30 bg-[rgba(26,26,46,0.12)] backdrop-blur-[2px] lg:hidden"
        onClick={onClose}
      />
      <div className="animate-menu-in fixed inset-x-0 top-14 z-40 lg:hidden">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          className="mx-4 mt-2 max-h-[calc(100dvh-80px)] overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] shadow-xl shadow-black/[0.07]"
        >
          {children}
        </div>
      </div>
    </>
  );
}

/** Ikonos menüsor — a belépett menü sor-stílusa, mindkét menü ezt használja. */
export function MobileMenuRow({
  href,
  icon,
  title,
  desc,
  /** Az éppen nyitott célpont — az org-váltó mintája szerint kiemelve. */
  active = false,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-3.5 transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS} ${
        active ? "bg-[var(--color-surface-subtle)]" : ""
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)] transition-colors group-hover:bg-[var(--color-border-default)] group-hover:text-[var(--color-text-secondary)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-body text-[var(--color-text-primary)] ${active ? "font-semibold" : "font-medium"}`}>
          {title}
        </p>
        {desc ? (
          <p className="truncate text-xs text-[var(--color-text-muted)]">{desc}</p>
        ) : null}
      </div>
      {active ? (
        <span aria-hidden className="mr-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-action-primary-bg)]" />
      ) : null}
      <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-border-soft)] transition-colors group-hover:text-[var(--color-text-muted)]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 2l4 4-4 4" />
      </svg>
    </Link>
  );
}

export function MobileMenuSectionLabel({ children }: { children: React.ReactNode }) {
  // Fraunces szekció-cím (stílus-transzfer): a mono-eyebrow helyett a
  // marketing-oldal szerkesztőségi karaktere – a szerkezet utility marad.
  return (
    <p className="px-4 pb-1.5 pt-4 font-fraunces text-base text-[var(--color-text-primary)]">
      {children}
    </p>
  );
}
