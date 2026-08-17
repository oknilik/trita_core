"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type EditorialBackAction =
  | { href: string; onBack?: never }
  | { href?: never; onBack: () => void };

type EditorialBackHeaderProps = EditorialBackAction & {
  backLabel: string;
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  headingLevel?: 1 | 2;
  className?: string;
};

type EditorialBackControlProps = EditorialBackAction & {
  backLabel: string;
  className?: string;
};

function BackArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 10H4M9 5l-5 5 5 5" />
    </svg>
  );
}

const backControlClassName =
  "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-surface-card text-[var(--color-accent-primary-strong)] shadow-[var(--ui-shadow-sm)] transition-all hover:-translate-x-0.5 hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-surface-highlight-warm)] hover:shadow-[var(--ui-shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)] focus-visible:ring-offset-2";

/** Az editorial visszavezérlő önálló változata olyan oldalakhoz,
 * ahol a cím egy saját hero- vagy tartalomkártyában marad. */
export function EditorialBackControl({
  backLabel,
  className,
  ...action
}: EditorialBackControlProps) {
  const controlClassName = cn(backControlClassName, className);

  return action.href ? (
    <Link href={action.href} aria-label={backLabel} className={controlClassName}>
      <BackArrow />
    </Link>
  ) : (
    <button
      type="button"
      onClick={action.onBack}
      aria-label={backLabel}
      className={controlClassName}
    >
      <BackArrow />
    </button>
  );
}

/**
 * Oldalszintű visszanavigáció, a célkontextust és az aktuális címet egyetlen
 * editorial fejrészbe rendezve. Linkes és kliensállapotot váltó nézethez is jó.
 */
export function EditorialBackHeader({
  backLabel,
  eyebrow,
  title,
  description,
  headingLevel = 1,
  className,
  ...action
}: EditorialBackHeaderProps) {
  const headingClassName =
    "mt-1 max-w-2xl font-fraunces text-title text-[var(--color-text-primary)]";

  return (
    <header
      className={cn(
        "grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3",
        className,
      )}
    >
      <EditorialBackControl backLabel={backLabel} {...action} />
      <div className="min-w-0">
        <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">
          {eyebrow}
        </p>
        {headingLevel === 1 ? (
          <h1 className={headingClassName}>{title}</h1>
        ) : (
          <h2 className={headingClassName}>{title}</h2>
        )}
        {description ? (
          <p className="mt-2 max-w-2xl text-body leading-relaxed text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
