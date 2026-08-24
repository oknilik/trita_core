"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────
// Közös mobilmenü-váz (2026-07-29, menü-konvergencia): a kijelentkezett
// (NavBar) és a belépett (NavHeaderUI) mobilmenü UGYANEZT a kártya-panel
// formát használja — backdrop + fejléc alatti lekerekített kártya + ikonos
// sorok. Így a belépés előtti/utáni élmény nem törik meg, és a menü-stílus
// egy helyen él.
//
// P1-UX-03: a váz egyben a dialog-szerződés hordozója is — role=dialog,
// Escape-zárás, háttér-scroll zár, fókusz-csapda és fókusz-visszaadás.
// Mindkét menü ezen keresztül örökli, egy helyen.
// ─────────────────────────────────────────────────────────────────────

export function MobileMenuShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { locale } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'a[href], button, input, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) {
          e.preventDefault();
          panelRef.current.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => {
      if (!panelRef.current?.contains(document.activeElement)) {
        panelRef.current?.focus();
      }
    }, 50);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      {/* Puha backdrop (stílus-transzfer a marketing-menüből): finom blur,
          kevesebb sötétítés — a lap érezhetően "mögötte" marad. */}
      <div
        className="fixed inset-0 z-30 bg-[rgba(26,26,46,0.12)] backdrop-blur-[2px] lg:hidden"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.menu", locale)}
        tabIndex={-1}
        className="animate-menu-in fixed inset-x-0 top-14 z-40 outline-none lg:hidden"
      >
        <div className="mx-4 mt-2 max-h-[calc(100dvh-80px)] overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] shadow-xl shadow-black/[0.07]">
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
  // marketing-oldal szerkesztőségi karaktere — a szerkezet utility marad.
  return (
    <p className="px-4 pb-1.5 pt-4 font-fraunces text-base text-[var(--color-text-primary)]">
      {children}
    </p>
  );
}
