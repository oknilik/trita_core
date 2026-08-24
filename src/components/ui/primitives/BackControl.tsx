"use client";

import Link from "next/link";
import { BackChevronIcon } from "@/components/ui/primitives/BackChevronIcon";
import { cn } from "@/lib/ui/cn";

type BackAction =
  | { href: string; onBack?: never }
  | { href?: never; onBack: () => void };

export type BackControlProps = BackAction & {
  label: string;
  className?: string;
  labelClassName?: string;
};

const controlClassName =
  "group inline-flex min-h-11 items-center gap-2 rounded-xl py-1 pl-1.5 pr-3 text-caption font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)] focus-visible:ring-offset-2";

/** Közös, feliratos visszanavigáció az elfogadott „A” vizuális irányban. */
export function BackControl({
  label,
  className,
  labelClassName,
  ...action
}: BackControlProps) {
  const content = (
    <>
      <BackChevronIcon />
      <span className={labelClassName}>{label}</span>
    </>
  );
  const classes = cn(controlClassName, className);

  return action.href ? (
    <Link href={action.href} aria-label={label} className={classes}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={action.onBack}
      aria-label={label}
      className={classes}
    >
      {content}
    </button>
  );
}
