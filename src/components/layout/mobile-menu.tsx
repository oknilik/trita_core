"use client";

import Link from "next/link";

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
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/20 lg:hidden"
        onClick={onClose}
        style={{ animation: "fade-in 150ms ease-out" }}
      />
      <div
        className="fixed inset-x-0 top-14 z-40 lg:hidden"
        style={{ animation: "fade-in 200ms ease-out" }}
      >
        <div className="mx-4 mt-2 max-h-[calc(100dvh-80px)] overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] shadow-lg shadow-black/[0.04]">
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
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc?: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[var(--color-surface-subtle)]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)] transition-colors group-hover:bg-[var(--color-border-default)] group-hover:text-[var(--color-text-secondary)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{title}</p>
        {desc ? (
          <p className="truncate text-[12px] text-[var(--color-text-muted)]">{desc}</p>
        ) : null}
      </div>
      <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-border-soft)] transition-colors group-hover:text-[var(--color-text-muted)]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 2l4 4-4 4" />
      </svg>
    </Link>
  );
}

export function MobileMenuSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pb-1 pt-3 text-micro font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
      {children}
    </p>
  );
}
